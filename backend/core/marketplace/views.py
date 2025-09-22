from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from marketplace.models import Restaurant, Offer, Booking, BookingSlot, OfferTimeSlot, BookingHold
from users.models import User
from marketplace.serializers import (
    RestaurantSerializer, OfferSerializer, BookingSerializer,
    AdminRestaurantSerializer, AdminRestaurantCreateUpdateSerializer,
    FeedCardSerializer, BannerSerializer, FiltersSerializer,
    AvailabilitySerializer, BookingHoldSerializer, BookingConfirmSerializer,
)
from marketplace.serializers import BookingSlotSerializer

class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read for anyone, write for platform admins (Django staff or custom admin type)."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # Allow if Django staff or custom user_type admin
        return getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin'


class IsRestaurantOwnerOrAdmin(permissions.BasePermission):
    """Object-level permission: allow owners to modify their restaurant, admins full access."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user and user.is_authenticated

    def has_object_permission(self, request, view, obj):  # obj is Restaurant
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin':
            return True
        return getattr(obj, 'owner_id', None) == user.id


class IsOfferOwnerOrAdmin(permissions.BasePermission):
    """Allow offer modifications by the owning restaurant's owner or admins."""
    def has_permission(self, request, view):
        # Allow reads universally
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # For create we validate in view.perform_create; permission-level allow authenticated users
        return True

    def has_object_permission(self, request, view, obj):  # obj is Offer
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin':
            return True
        # Owner of the related restaurant
        return getattr(obj.restaurant, 'owner_id', None) == user.id

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'cuisine_type', 'address']
    filterset_fields = ['cuisine_type', 'price_range', 'is_active', 'is_featured']
    ordering_fields = ['name', 'rating', 'created_at']
    ordering = ['-created_at']
    permission_classes = [IsRestaurantOwnerOrAdmin]

    def perform_create(self, serializer):
        # Set the owner to the requesting user if authenticated; otherwise raise
        user = self.request.user
        if not user or not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required to create restaurants.")
        serializer.save(owner=user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """List restaurants owned by the current user."""
        owned = Restaurant.objects.filter(owner=request.user)
        page = self.paginate_queryset(owned)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(owned, many=True)
        return Response(ser.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def transfer_owner(self, request, pk=None):
        """Admin or current owner can transfer ownership to another restaurant_owner user."""
        restaurant = self.get_object()
        user = request.user
        if not (getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin' or restaurant.owner_id == user.id):
            return Response({'error': 'Not authorized to transfer ownership.'}, status=status.HTTP_403_FORBIDDEN)
        new_owner_id = request.data.get('new_owner_id')
        if not new_owner_id:
            return Response({'error': 'new_owner_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_owner = User.objects.get(id=new_owner_id)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        if getattr(new_owner, 'user_type', '') != 'restaurant_owner' and not (getattr(new_owner, 'is_staff', False) or getattr(new_owner, 'user_type', '') == 'admin'):
            return Response({'error': 'New owner must have user_type restaurant_owner or be an admin.'}, status=status.HTTP_400_BAD_REQUEST)
        restaurant.owner = new_owner
        restaurant.save(update_fields=['owner'])
        return Response({'message': 'Ownership transferred successfully.', 'restaurant_id': restaurant.id, 'new_owner_id': new_owner.id})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def filters(self, request):
        """Return facets for cities, cuisines, brands, themes, and price tiers."""
        from django.db.models import Value as V
        cities = list(Restaurant.objects.exclude(address__isnull=True).exclude(address='').values_list('address', flat=True).distinct()[:50])
        cuisines = list(Restaurant.objects.exclude(cuisine_type__isnull=True).exclude(cuisine_type='').values_list('cuisine_type', flat=True).distinct())
        brands = list(Restaurant.objects.exclude(name__isnull=True).exclude(name='').values_list('name', flat=True).distinct()[:50])
        themes = ['Buffet', 'Rooftop', 'Family', 'Romantic', 'Vegan']
        price_tiers = [1,2,3,4]
        data = {
            'cities': cities,
            'cuisines': cuisines,
            'brands': brands,
            'themes': themes,
            'price_tiers': price_tiers,
        }
        return Response(FiltersSerializer(data).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        """Return active restaurants near a coordinate within a radius (km).

        Query params:
          - lat (required)
          - lng (required)
          - radius_km (optional, default 5)
          - limit (optional, default 50)
        """
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response({'error': 'lat and lng are required numeric query params'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            radius_km = float(request.query_params.get('radius_km', 5))
        except ValueError:
            radius_km = 5.0
        try:
            limit = int(request.query_params.get('limit', 50))
        except ValueError:
            limit = 50

        # crude Haversine computation in SQL via bounding box, then refine in Python
        # bounding box first
        import math
        earth_radius_km = 6371.0
        dlat = (radius_km / earth_radius_km) * (180.0 / math.pi)
        dlng = (radius_km / earth_radius_km) * (180.0 / math.pi) / max(math.cos(math.radians(lat)), 0.0001)
        min_lat, max_lat = lat - dlat, lat + dlat
        min_lng, max_lng = lng - dlng, lng + dlng

        candidates = Restaurant.objects.filter(
            is_active=True,
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__gte=min_lat, latitude__lte=max_lat,
            longitude__gte=min_lng, longitude__lte=max_lng,
        )[:limit*2]

        def haversine_km(lat1, lng1, lat2, lng2):
            phi1, phi2 = math.radians(lat1), math.radians(lat2)
            dphi = math.radians(lat2 - lat1)
            dlambda = math.radians(lng2 - lng1)
            a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
            return 2*earth_radius_km*math.asin(math.sqrt(a))

        results = []
        for r in candidates:
            try:
                dist = haversine_km(float(r.latitude), float(r.longitude), lat, lng)
            except Exception:
                continue
            if dist <= radius_km:
                results.append((dist, r))
        results.sort(key=lambda x: x[0])
        items = [self.get_serializer(r).data | {'distance_km': round(d, 2)} for d, r in results[:limit]]
        return Response(items)

class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all().select_related('restaurant')
    serializer_class = OfferSerializer
    permission_classes = [IsOfferOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description', 'restaurant__name']
    filterset_fields = ['restaurant', 'offer_type', 'is_active', 'is_featured', 'recurring']
    ordering_fields = ['title', 'start_date', 'end_date', 'created_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        user = self.request.user
        restaurant = serializer.validated_data.get('restaurant')
        if not restaurant:
            raise serializers.ValidationError({'restaurant': 'Restaurant is required.'})
        # Admins allowed regardless; otherwise must own restaurant
        if not (getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin'):
            if restaurant.owner_id != user.id:
                raise permissions.PermissionDenied('You can only create offers for your own restaurants.')
        serializer.save()

    def perform_update(self, serializer):
        """Allow admins to update any offer. Allow owners to update offers for their own restaurants.
        Prevent owners from reassigning an offer to a restaurant they don't own.
        """
        user = self.request.user
        new_restaurant = serializer.validated_data.get('restaurant')
        if getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin':
            return serializer.save()
        # Non-admin path: ensure ownership and prevent reassignment to foreign restaurant
        instance = self.get_object()
        # Must own the current offer's restaurant
        if instance.restaurant.owner_id != user.id:
            raise permissions.PermissionDenied('You can only update offers for your own restaurants.')
        # If attempting to change restaurant, it must also be owned by the user
        if new_restaurant and new_restaurant.owner_id != user.id:
            raise permissions.PermissionDenied('You cannot reassign this offer to a restaurant you do not own.')
        return serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def timeslots(self, request):
        """Unified timeslot discounts for a restaurant and date.

        Query params:
          - restaurant (id, required)
          - date (YYYY-MM-DD, optional; defaults to today)
          - limit (int, optional) to cap number of returned timeslots
        Returns a list of timeslots with discount percentage and source ('slot','offer','both').
        Prefers the higher discount when both exist at the same start time.
        """
        import datetime
        from django.utils import timezone

        restaurant_id = request.query_params.get('restaurant')
        if not restaurant_id:
            return Response({'error': 'restaurant query param required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                return Response({'error': 'Invalid date format (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.localdate()

        # Collect active slots for the date
        slot_entries = {}
        slots = BookingSlot.objects.filter(restaurant=restaurant, date=target_date, is_active=True)
        for s in slots:
            # Only include bookable/open slots with remaining capacity
            status_eff = s.effective_status()
            rem = s.remaining_capacity
            if status_eff == 'open' and (rem is None or rem > 0):
                key = s.start_time.strftime('%H:%M')
                slot_disc = float(s.discount_percentage) if s.discount_percentage is not None else None
                slot_entries[key] = {
                    'time': key,
                    'discount_percent': slot_disc,
                    'source': 'slot',
                    'slot_id': s.id,
                    'offer_id': None,
                }

    # Collect active offers applicable to the date/weekday
        weekday = target_date.weekday()
        offers_qs = self.queryset.filter(
            restaurant=restaurant,
            is_active=True,
            start_date__lte=target_date,
            end_date__gte=target_date,
        )
        offer_entries = {}
        for off in offers_qs:
            if off.days_of_week:
                allowed = [int(d.strip()) for d in off.days_of_week.split(',') if d.strip().isdigit()]
                if weekday not in allowed:
                    continue
            # Use 30-minute slots if defined; otherwise fall back to the single hour window start
            slots = OfferTimeSlot.objects.filter(offer=off, is_active=True).order_by('start_time')
            if slots.exists():
                for ts in slots:
                    key = ts.start_time.strftime('%H:%M')
                    disc_pct = None
                    if ts.discount_percentage is not None:
                        disc_pct = float(ts.discount_percentage)
                    elif ts.discount_amount is not None and off.original_price:
                        try:
                            disc_pct = max(0.0, min(100.0, float(ts.discount_amount) / float(off.original_price) * 100.0))
                        except Exception:
                            disc_pct = None
                    if disc_pct is None:
                        continue
                    offer_entries[key] = {
                        'time': key,
                        'discount_percent': disc_pct,
                        'source': 'offer',
                        'slot_id': None,
                        'offer_id': off.id,
                    }
            else:
                try:
                    key = off.start_time.strftime('%H:%M')
                except Exception:
                    continue
                disc_pct = None
                if off.discount_percentage is not None:
                    disc_pct = float(off.discount_percentage)
                elif off.discount_amount is not None and off.original_price:
                    try:
                        disc_pct = max(0.0, min(100.0, float(off.discount_amount) / float(off.original_price) * 100.0))
                    except Exception:
                        disc_pct = None
                if disc_pct is None:
                    continue
                offer_entries[key] = {
                    'time': key,
                    'discount_percent': disc_pct,
                    'source': 'offer',
                    'slot_id': None,
                    'offer_id': off.id,
                }

        # Merge, preferring higher discount where both exist
        merged = {}
        for t, v in offer_entries.items():
            merged[t] = v
        for t, v in slot_entries.items():
            if t not in merged:
                merged[t] = v
            else:
                # both exist -> choose higher discount, annotate source
                existing = merged[t]
                e_pct = existing.get('discount_percent') or 0
                v_pct = v.get('discount_percent') or 0
                if v_pct > e_pct:
                    # slot wins
                    v['source'] = 'both' if existing['source'] == 'offer' else v['source']
                    v['offer_id'] = existing.get('offer_id')
                    merged[t] = v
                else:
                    # offer stays, but note both
                    existing['source'] = 'both'
                    existing['slot_id'] = v.get('slot_id')

        # Build sorted list
        timeslots = list(merged.values())
        timeslots.sort(key=lambda x: x['time'])

        limit = request.query_params.get('limit')
        if limit:
            try:
                lim = int(limit)
                if lim > 0:
                    timeslots = timeslots[:lim]
            except ValueError:
                pass

        return Response({
            'restaurant_id': restaurant.id,
            'date': target_date.isoformat(),
            'timeslots': timeslots,
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def feed(self, request):
        """Cursor-paginated offers feed aggregated as cards with slot list.

        Query: city, q, cuisine, brand, theme, min_discount, time_bucket, sort, cursor
        """
        from django.utils import timezone
        import base64, json, datetime as dt
        today = timezone.localdate()
        city = request.query_params.get('city')
        # Automatically include empty restaurants (no active offers) for a city selection
        include_empty = True if city else False
        q = request.query_params.get('q')
        cuisine = request.query_params.get('cuisine')
        brand = request.query_params.get('brand')
        theme = request.query_params.get('theme')
        min_discount = request.query_params.get('min_discount')
        time_bucket = request.query_params.get('time_bucket')
        sort = request.query_params.get('sort', 'recommended')
        cursor = request.query_params.get('cursor')
        page_size = 12
        offset = 0
        if cursor:
            try:
                payload = json.loads(base64.b64decode(cursor).decode('utf-8'))
                offset = int(payload.get('offset', 0))
            except Exception:
                offset = 0

        # Filter active offers for today and allowed weekdays
        weekday = today.weekday()
        offers_qs = Offer.objects.filter(
            is_active=True,
            restaurant__is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        ).select_related('restaurant')

        # Include offers that are active in the date range regardless of weekday; we'll only emit times for those allowed today.
        offers = list(offers_qs)

        from django.db.models import Q
        qs = Offer.objects.filter(id__in=[o.id for o in offers]).select_related('restaurant')
        # Central bounding boxes accessible for both filtering & card city detection
        CITY_BOXES = {
            'phnom penh': (11.35, 11.80, 104.75, 105.15),
            'siem reap': (13.25, 13.52, 103.70, 103.97),
            'sihanoukville': (10.50, 10.78, 103.40, 103.68),
            'battambang': (12.95, 13.18, 103.08, 103.32),
            'kampot': (10.50, 10.78, 104.10, 104.33),
            'kep': (10.38, 10.56, 104.22, 104.38),
            'kampong cham': (11.90, 12.10, 105.38, 105.54),
            'kampong thom': (12.62, 12.78, 104.82, 104.98),
            'poipet': (13.60, 13.72, 102.50, 102.64),
        }
        CITY_ALIASES = {
            'siem riep': 'siem reap',
            'phnompenh': 'phnom penh',
        }

        def normalize_city(value: str | None) -> str | None:
            if not value:
                return None
            v = value.strip().lower()
            return CITY_ALIASES.get(v, v)
        # Track restaurant IDs matched by city so we can optionally include empty ones
        city_restaurant_ids = set()
        if city:
            norm_city = normalize_city(city)
            box = CITY_BOXES.get(norm_city) if norm_city else None
            if box:
                lat_min, lat_max, lon_min, lon_max = box
                # Offer-level coord filter (restaurant__ prefixed)
                offer_coord_filter = Q(restaurant__latitude__gte=lat_min) & Q(restaurant__latitude__lte=lat_max) & \
                                      Q(restaurant__longitude__gte=lon_min) & Q(restaurant__longitude__lte=lon_max)
                # Restaurant-level coord filter (no prefix)
                rest_coord_filter = Q(latitude__gte=lat_min) & Q(latitude__lte=lat_max) & \
                                     Q(longitude__gte=lon_min) & Q(longitude__lte=lon_max)
                qs = qs.filter(offer_coord_filter | (
                    Q(restaurant__latitude__isnull=True, restaurant__longitude__isnull=True, restaurant__address__icontains=norm_city)
                ))
                if include_empty:
                    rest_q = Restaurant.objects.filter(is_active=True).filter(
                        rest_coord_filter | Q(latitude__isnull=True, longitude__isnull=True, address__icontains=norm_city)
                    ).values_list('id', flat=True)
                    city_restaurant_ids.update(rest_q)
            else:
                # No bounding box; rely on normalized address contains
                qs = qs.filter(restaurant__address__icontains=norm_city)
                if include_empty:
                    rest_q = Restaurant.objects.filter(is_active=True, address__icontains=norm_city).values_list('id', flat=True)
                    city_restaurant_ids.update(rest_q)
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(restaurant__name__icontains=q))
        if cuisine:
            qs = qs.filter(restaurant__cuisine_type__icontains=cuisine)
        if brand:
            qs = qs.filter(restaurant__name__icontains=brand)
        if theme:
            qs = qs.filter(Q(description__icontains=theme) | Q(title__icontains=theme))

        if sort == 'highest_discount':
            qs = qs.order_by('-discount_percentage', '-discount_amount')
        elif sort == 'most_popular':
            qs = qs.order_by('-restaurant__rating', '-restaurant__created_at')
        elif sort == 'nearest_time':
            qs = qs.order_by('start_time')
        else:
            qs = qs.order_by('-is_featured', '-restaurant__rating', '-created_at')

        cards = []
        now = timezone.localtime()

        # Cache merged slots per restaurant to avoid recomputing for multiple offers of same restaurant
        merged_slots_cache: dict[int, list[dict]] = {}

        cards_emitted = 0
        for off in qs[offset: offset + page_size]:
            rest = off.restaurant
            # If already computed for this restaurant, reuse
            if rest.id in merged_slots_cache:
                slot_items = merged_slots_cache[rest.id]
            else:
                # Build a unified slot list across ALL active offers for this restaurant (today + weekday)
                # 1) Gather all relevant offers for this restaurant from the pre-filtered list
                rest_offers = [o for o in offers if o.restaurant_id == rest.id]

                # Helper: compute percentage
                def pct_from_any(offr, ts=None):
                    if ts is not None:
                        if ts.discount_percentage is not None:
                            try:
                                return int(float(ts.discount_percentage))
                            except Exception:
                                return 0
                        if ts.discount_amount is not None and offr.original_price:
                            try:
                                val = (float(ts.discount_amount) / float(offr.original_price)) * 100.0
                                return max(0, min(100, int(round(val))))
                            except Exception:
                                return 0
                    if offr.discount_percentage is not None:
                        try:
                            return int(float(offr.discount_percentage))
                        except Exception:
                            return 0
                    return 0

                # 2) Merge by time using highest discount
                merged_by_time: dict[str, dict] = {}
                for ro in rest_offers:
                    # Skip timeslot generation if this offer is not allowed today by its days_of_week constraint.
                    allowed_today = True
                    if ro.days_of_week:
                        try:
                            allowed_days = [int(d.strip()) for d in ro.days_of_week.split(',') if d.strip().isdigit()]
                            allowed_today = (weekday in allowed_days)
                        except Exception:
                            allowed_today = True
                    if not allowed_today:
                        continue

                    ro_ts = OfferTimeSlot.objects.filter(offer=ro, is_active=True).order_by('start_time')
                    if ro_ts.exists():
                        for ts in ro_ts:
                            time_str = ts.start_time.strftime('%H:%M')
                            # Skip past times today
                            if today == now.date() and (ts.start_time.hour * 60 + ts.start_time.minute) <= (now.hour * 60 + now.minute):
                                continue
                            disc = pct_from_any(ro, ts)
                            if min_discount and disc < int(min_discount):
                                continue
                            cur = merged_by_time.get(time_str)
                            if not cur or disc > cur['discount']:
                                merged_by_time[time_str] = {'time': time_str, 'discount': disc}
                    else:
                        # Fall back to the offer's time window on a 30-minute grid
                        cur_dt = dt.datetime.combine(today, ro.start_time)
                        end_dt = dt.datetime.combine(today, ro.end_time)
                        while cur_dt < end_dt:
                            time_str = cur_dt.strftime('%H:%M')
                            if today == now.date() and (cur_dt.time().hour * 60 + cur_dt.time().minute) <= (now.hour * 60 + now.minute):
                                cur_dt += dt.timedelta(minutes=30)
                                continue
                            disc = pct_from_any(ro)
                            if min_discount and disc < int(min_discount):
                                cur_dt += dt.timedelta(minutes=30)
                                continue
                            cur = merged_by_time.get(time_str)
                            if not cur or disc > cur['discount']:
                                merged_by_time[time_str] = {'time': time_str, 'discount': disc}
                            cur_dt += dt.timedelta(minutes=30)

                # 3) Attach real slot info where available; else synthetic ids
                slot_items = []
                for time_str, info in sorted(merged_by_time.items(), key=lambda kv: kv[0]):
                    hh, mm = map(int, time_str.split(':'))
                    try:
                        bslot = BookingSlot.objects.filter(restaurant=rest, date=today, start_time=dt.time(hh, mm)).first()
                    except Exception:
                        bslot = None
                    disc = info['discount']
                    if bslot:
                        status_eff = bslot.effective_status()
                        rem = bslot.remaining_capacity
                        # Note: we show all open slots, even if capacity is low, client can re-check on booking page
                        if status_eff != 'open':
                            continue
                        cap = rem if rem is not None else 99
                        slot_items.append({'slot_id': str(bslot.id), 'time': time_str, 'discount': disc, 'capacity': cap})
                    else:
                        # This is a synthetic slot, it has no real BookingSlot yet.
                        # The frontend should treat it as a non-bookable offer time.
                        slot_items.append({'slot_id': None, 'time': time_str, 'discount': disc, 'capacity': 99})

                # 4) Optional time bucket filtering
                if time_bucket in ('lunch', 'afternoon', 'dinner', 'late'):
                    def bucket(h: int):
                        return 'lunch' if 11 <= h < 14 else 'afternoon' if 14 <= h < 17 else 'dinner' if 17 <= h < 21 else 'late'
                    slot_items = [s for s in slot_items if bucket(int(s['time'][:2])) == time_bucket]

                merged_slots_cache[rest.id] = slot_items

            # Determine city for card: prefer bounding box mapping over address suffix
            detected_city = ''
            if getattr(rest, 'latitude', None) is not None and getattr(rest, 'longitude', None) is not None:
                lat = float(rest.latitude)
                lon = float(rest.longitude)
                for cname, (la_min, la_max, lo_min, lo_max) in CITY_BOXES.items():  # type: ignore
                    if la_min <= lat <= la_max and lo_min <= lon <= lo_max:
                        detected_city = cname.title()
                        break
            if not detected_city and getattr(rest, 'address', None):
                if ',' in rest.address:
                    detected_city = rest.address.split(',')[-1].strip().title()
                else:
                    detected_city = rest.address.strip().title()

            card = {
                'offer_id': str(off.id),
                'restaurant_id': str(rest.id),
                'name': rest.name,
                'city': detected_city,
                'image_url': (rest.image_file.url if getattr(rest, 'image_file', None) else (rest.image_url or '')),
                'rating': float(rest.rating or 0),
                'reservations_count': rest.bookings.count(),
                'price_tier': int(rest.price_range or 2),
                'badges': [b for b in (['Hot'] if rest.is_featured else []) + (['New'] if (rest.created_at and (timezone.now() - rest.created_at).days <= 30) else [])],
                'slots': slot_items,
            }
            cards.append(card)
            cards_emitted += 1

        # If we have a city filter, include_empty flag, and we emitted nothing (or fewer than page size) add placeholder cards for restaurants with no active offers
        if city and include_empty and cards_emitted < page_size:
            remaining = page_size - cards_emitted
            extra_ids = [rid for rid in city_restaurant_ids if rid not in [c['restaurant_id'] for c in cards]][:remaining]
            if extra_ids:
                extra_restaurants = Restaurant.objects.filter(id__in=extra_ids)
                for rest in extra_restaurants:
                    # Determine city same way as above
                    detected_city = ''
                    if getattr(rest, 'latitude', None) is not None and getattr(rest, 'longitude', None) is not None:
                        lat = float(rest.latitude)
                        lon = float(rest.longitude)
                        for cname, (la_min, la_max, lo_min, lo_max) in CITY_BOXES.items():  # type: ignore
                            if la_min <= lat <= la_max and lo_min <= lon <= lo_max:
                                detected_city = cname.title()
                                break
                    if not detected_city and getattr(rest, 'address', None):
                        if ',' in rest.address:
                            detected_city = rest.address.split(',')[-1].strip().title()
                        else:
                            detected_city = rest.address.strip().title()
                    cards.append({
                        'offer_id': '',
                        'restaurant_id': str(rest.id),
                        'name': rest.name,
                        'city': detected_city,
                        'image_url': (rest.image_file.url if getattr(rest, 'image_file', None) else (rest.image_url or '')),
                        'rating': float(rest.rating or 0),
                        'reservations_count': rest.bookings.count(),
                        'price_tier': int(rest.price_range or 2),
                        'badges': [b for b in (['Hot'] if rest.is_featured else []) + (['New'] if (rest.created_at and (timezone.now() - rest.created_at).days <= 30) else [])],
                        'slots': [],
                    })
                    cards_emitted += 1
                    if cards_emitted >= page_size:
                        break

        next_cursor = None
        # Adjust total to include extra restaurants if include_empty
        total = qs.count()
        if city and include_empty:
            total = max(total, len(city_restaurant_ids))
        if total > offset + page_size:
            next_cursor = base64.b64encode(json.dumps({'offset': offset + page_size}).encode('utf-8')).decode('utf-8')

        return Response({'results': FeedCardSerializer(cards, many=True).data, 'next_cursor': next_cursor})

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def banners(self, request):
        from django.utils import timezone
        now = timezone.now()
        items = []
        featured = Offer.objects.filter(is_active=True, is_featured=True).select_related('restaurant')[:3]
        for i, o in enumerate(featured, start=1):
            items.append({
                'id': f'b{i}',
                'image_url': (o.restaurant.image_file.url if getattr(o.restaurant, 'image_file', None) else (o.restaurant.image_url or '')),
                'headline': o.title,
                'subtext': (o.description or '')[:80],
                'cta_label': 'Reserve now',
                'cta_href': f"/restaurants/{o.restaurant.id}",
                'active_from': now,
                'active_to': now,
            })
        return Response(BannerSerializer(items, many=True).data)

    @action(detail=False, methods=['get'])
    def hourly_offers(self, request):
        """Return a 24-slot hourly offer map for a restaurant and optional date.

        Query params:
          restaurant (id, required)
          date (YYYY-MM-DD, optional; defaults today) used to filter by date range and days_of_week.
        """
        from django.utils import timezone
        import datetime
        restaurant_id = request.query_params.get('restaurant')
        if not restaurant_id:
            return Response({'error': 'restaurant query param required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.date.fromisoformat(date_str)
            except ValueError:
                return Response({'error': 'Invalid date format (expected YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = timezone.localdate()

        weekday = target_date.weekday()
        offers_qs = self.queryset.filter(
            restaurant=restaurant,
            is_active=True,
            start_date__lte=target_date,
            end_date__gte=target_date,
        )
        # Filter by days_of_week if present
        filtered = []
        for off in offers_qs:
            if off.days_of_week:
                allowed = [int(d.strip()) for d in off.days_of_week.split(',') if d.strip().isdigit()]
                if weekday not in allowed:
                    continue
            filtered.append(off)

        # Build 24 slots (00-01 ... 23-24) -> single offer or null
        slot_map = []
        for hour in range(24):
            slot_offer = None
            for off in filtered:
                try:
                    if off.start_time.hour == hour:  # one-hour normalized offer
                        slot_offer = off
                        break
                except AttributeError:
                    continue
            slot_map.append({
                'hour': hour,
                'start': f"{hour:02d}:00",
                'end': f"{(hour+1)%24:02d}:00",
                'offer': OfferSerializer(slot_offer, context={'request': request}).data if slot_offer else None
            })

        return Response({
            'date': target_date.isoformat(),
            'restaurant_id': restaurant.id,
            'slots': slot_map
        })

    @action(detail=False, methods=['get'])
    def active_offers(self, request):
        """Get currently active offers"""
        from django.utils import timezone
        today = timezone.now().date()
        
        active_offers = self.queryset.filter(
            is_active=True,
            restaurant__is_active=True,
            start_date__lte=today,
            end_date__gte=today
        )
        
        # Apply additional filtering based on days_of_week
        weekday = today.weekday()
        filtered_offers = []
        
        for offer in active_offers:
            if offer.days_of_week:
                allowed_days = [int(d.strip()) for d in offer.days_of_week.split(',') if d.strip().isdigit()]
                if weekday in allowed_days:
                    filtered_offers.append(offer)
            else:
                filtered_offers.append(offer)
        
        serializer = self.get_serializer(filtered_offers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured_offers(self, request):
        """Get featured offers"""
        featured = self.queryset.filter(is_featured=True, is_active=True)
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def materialize_slot(self, request):
        """Create or return a live BookingSlot for a given restaurant/date/time if an active offer covers it.

        Payload: { restaurant: id, date: YYYY-MM-DD, time: HH:MM, capacity?: int, min_party_size?: int, max_party_size?: int }
        Rules:
        - Only allowed when there is at least one active Offer (date range + weekday) for that restaurant that includes the requested time,
          via either an OfferTimeSlot at that exact minute or within its offer window.
        - Creates a 30-minute BookingSlot [time, time+30m] if not exists. Returns the existing slot if already present.
        - Sets discount_percentage to the highest applicable discount among matching offers.
        """
        from django.utils import timezone
        import datetime as dt

        rid = request.data.get('restaurant')
        date_str = request.data.get('date')
        time_str = request.data.get('time')
        if not (rid and date_str and time_str):
            return Response({'error': 'restaurant, date, and time are required'}, status=400)
        try:
            restaurant = Restaurant.objects.get(id=int(rid))
        except (ValueError, Restaurant.DoesNotExist):
            return Response({'error': 'Restaurant not found'}, status=404)
        try:
            target_date = dt.date.fromisoformat(str(date_str))
            hh, mm = map(int, str(time_str).split(':')[:2])
            start_time = dt.time(hh, mm)
            end_dt = (dt.datetime.combine(target_date, start_time) + dt.timedelta(minutes=30))
            end_time = end_dt.time()
        except Exception:
            return Response({'error': 'Invalid date or time format'}, status=400)

        # Validate there is an active offer covering this date & time
        weekday = target_date.weekday()
        offers_qs = Offer.objects.filter(
            restaurant=restaurant,
            is_active=True,
            start_date__lte=target_date,
            end_date__gte=target_date,
        )
        applicable = []
        for off in offers_qs:
            if off.days_of_week:
                allowed = [int(d.strip()) for d in off.days_of_week.split(',') if d.strip().isdigit()]
                if weekday not in allowed:
                    continue
            # match by explicit OfferTimeSlot or within offer window
            has_ts = OfferTimeSlot.objects.filter(offer=off, is_active=True, start_time=start_time).exists()
            in_window = False
            try:
                in_window = off.start_time <= start_time < off.end_time
            except Exception:
                in_window = False
            if has_ts or in_window:
                applicable.append(off)

        if not applicable:
            return Response({'error': 'No active offer covers this time'}, status=409)

        # Compute highest discount among applicable offers at that time
        def pct_for(off: Offer, st: dt.time):
            ts = OfferTimeSlot.objects.filter(offer=off, is_active=True, start_time=st).first()
            if ts and ts.discount_percentage is not None:
                try:
                    return float(ts.discount_percentage)
                except Exception:
                    return 0.0
            if ts and ts.discount_amount is not None and off.original_price:
                try:
                    return max(0.0, min(100.0, float(ts.discount_amount) / float(off.original_price) * 100.0))
                except Exception:
                    return 0.0
            if off.discount_percentage is not None:
                try:
                    return float(off.discount_percentage)
                except Exception:
                    return 0.0
            return 0.0

        best_pct = 0.0
        for off in applicable:
            best_pct = max(best_pct, pct_for(off, start_time))

        # Get or create the BookingSlot
        slot = BookingSlot.objects.filter(restaurant=restaurant, date=target_date, start_time=start_time).first()
        if not slot:
            capacity = int(request.data.get('capacity') or 0)  # 0 = unlimited
            min_party = int(request.data.get('min_party_size') or 1)
            max_party = int(request.data.get('max_party_size') or 20)
            slot = BookingSlot.objects.create(
                restaurant=restaurant,
                date=target_date,
                start_time=start_time,
                end_time=end_time,
                discount_percentage=best_pct if best_pct > 0 else None,
                capacity=capacity,
                min_party_size=min_party,
                max_party_size=max_party,
                status='open',
                is_active=True,
            )
        data = BookingSlotSerializer(slot, context={'request': request}).data
        return Response(data, status=201)

    @action(detail=False, methods=['get'])
    def by_restaurant(self, request):
        """Get offers grouped by restaurant"""
        restaurant_id = request.query_params.get('restaurant_id')
        if restaurant_id:
            offers = self.queryset.filter(restaurant_id=restaurant_id, is_active=True)
        else:
            offers = self.queryset.filter(is_active=True)
        
        serializer = self.get_serializer(offers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of an offer"""
        offer = self.get_object()
        offer.is_active = not offer.is_active
        offer.save()
        return Response({
            'message': f'Offer {"activated" if offer.is_active else "deactivated"} successfully',
            'is_active': offer.is_active
        })

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of an offer"""
        offer = self.get_object()
        offer.is_featured = not offer.is_featured
        offer.save()
        return Response({
            'message': f'Offer {"featured" if offer.is_featured else "unfeatured"} successfully',
            'is_featured': offer.is_featured
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Perform bulk actions on multiple offers"""
        action_type = request.data.get('action')
        offer_ids = request.data.get('offer_ids', [])
        
        if not action_type or not offer_ids:
            return Response(
                {'error': 'Action and offer_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow admin to operate on all; owners can operate on their own restaurants' offers
        user = request.user
        all_offers = Offer.objects.filter(id__in=offer_ids).select_related('restaurant')
        if getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin':
            offers = all_offers
        else:
            offers = all_offers.filter(restaurant__owner=user)
        unauthorized_count = max(0, len(offer_ids) - offers.count())

        if action_type == 'activate':
            offers.update(is_active=True)
            message = f'{offers.count()} offers activated'
        elif action_type == 'deactivate':
            offers.update(is_active=False)
            message = f'{offers.count()} offers deactivated'
        elif action_type == 'feature':
            offers.update(is_featured=True)
            message = f'{offers.count()} offers featured'
        elif action_type == 'unfeature':
            offers.update(is_featured=False)
            message = f'{offers.count()} offers unfeatured'
        elif action_type == 'delete':
            count = offers.count()
            offers.delete()
            message = f'{count} offers deleted'
        else:
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response = {'message': message, 'processed': offers.count()}
        if unauthorized_count:
            response['skipped_unauthorized'] = unauthorized_count
        return Response(response)

    @action(detail=False, methods=['post'])
    def generate_schedule(self, request):
        """Generate multiple hourly offers each containing 30‑minute sub-slots (Eatigo style).

        Payload example (percentage offers):
        {
          "restaurant": 5,
          "offer_type": "percentage",            # or "amount"
          "title_template": "Lunch Deal {hour}:00", # {hour} placeholder replaced
          "description": "Auto generated lunch deal",
          "start_date": "2025-08-16",
          "end_date": "2025-09-30",
          "days_of_week": "0,1,2,3,4",           # optional
          "hours": [12,13,18,19],                 # 24h integers
          "slots_pattern": [                      # applied to every hour unless hour_specific provided
             {"minute": 0, "discount_percentage": 50},
             {"minute": 30, "discount_percentage": 40}
          ],
          "hour_specific": {                      # optional per-hour override of slot patterns
             "18": [ {"minute":0, "discount_percentage":40}, {"minute":30, "discount_percentage":30} ]
          },
          "original_price": 0,                    # optional (needed if using discount_amount to compute %) 
          "replace": true                         # if true delete existing one-hour offers starting at these hours in range
        }

        Rules:
        - Creates one Offer per listed hour with start_time=HH:00 end_time=HH+1:00.
        - For each pattern entry creates two OfferTimeSlot (HH:MM to HH:MM+30).
        - Skips hours that would duplicate an existing offer unless replace=true.
        - Ownership: only admin/staff or restaurant owner.
        """
        import datetime
        from django.utils import timezone
        data = request.data
        restaurant_id = data.get('restaurant')
        if not restaurant_id:
            return Response({'error': 'restaurant is required'}, status=400)
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({'error': 'Restaurant not found'}, status=404)

        user = request.user
        if not (getattr(user,'is_staff',False) or getattr(user,'user_type','')=='admin' or restaurant.owner_id == getattr(user,'id',None)):
            return Response({'error':'Not authorized for this restaurant'}, status=403)

        try:
            start_date = datetime.date.fromisoformat(data.get('start_date'))
            end_date = datetime.date.fromisoformat(data.get('end_date'))
        except Exception:
            return Response({'error':'start_date and end_date must be ISO YYYY-MM-DD'}, status=400)
        if start_date > end_date:
            return Response({'error':'start_date cannot be after end_date'}, status=400)

        hours = data.get('hours') or []
        if not isinstance(hours, list) or not hours:
            return Response({'error':'hours must be a non-empty list of integers (0-23)'}, status=400)
        for h in hours:
            if not isinstance(h,int) or h<0 or h>23:
                return Response({'error':f'invalid hour value {h}'}, status=400)

        offer_type = data.get('offer_type','percentage')
        if offer_type not in ('percentage','amount'):
            return Response({'error':'offer_type must be percentage or amount'}, status=400)

        title_template = data.get('title_template','Deal {hour}:00')
        description = data.get('description','Auto generated offer')
        days_of_week = data.get('days_of_week','')  # optional
        replace = bool(data.get('replace', False))
        original_price = data.get('original_price')

        slots_pattern = data.get('slots_pattern') or []
        hour_specific = data.get('hour_specific') or {}
        if (not slots_pattern) and (not hour_specific):
            return Response({'error':'Provide slots_pattern or hour_specific'}, status=400)

        def normalize_pattern(pat_list):
            out=[]
            for entry in pat_list:
                minute = entry.get('minute')
                if minute not in (0,30):
                    raise ValueError(f'invalid minute {minute}, must be 0 or 30')
                # Support either percentage or amount
                disc_pct = entry.get('discount_percentage')
                disc_amt = entry.get('discount_amount')
                if offer_type=='percentage' and disc_pct is None:
                    raise ValueError('discount_percentage required for percentage offer')
                if offer_type=='amount' and disc_amt is None:
                    raise ValueError('discount_amount required for amount offer')
                out.append({'minute':minute,'discount_percentage':disc_pct,'discount_amount':disc_amt})
            return out

        try:
            base_pattern = normalize_pattern(slots_pattern) if slots_pattern else None
            per_hour_patterns = {str(k): normalize_pattern(v) for k,v in hour_specific.items()}
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        created=[]
        skipped=[]
        deleted=0
        for hour in hours:
            # Optional replacement of existing one-hour offers
            existing_qs = Offer.objects.filter(restaurant=restaurant, start_time__hour=hour, end_time__hour=(hour+1)%24, start_date=start_date, end_date=end_date)
            if existing_qs.exists():
                if replace:
                    deleted += existing_qs.count()
                    existing_qs.delete()
                else:
                    skipped.append(hour)
                    continue
            # Build offer data
            offer_title = title_template.replace('{hour}', f'{hour:02d}')
            # Availability / booking settings (with sane defaults if not supplied)
            available_quantity = data.get('available_quantity', 10)
            max_people_per_booking = data.get('max_people_per_booking', 6)
            min_advance_booking = data.get('min_advance_booking', 1)
            offer_kwargs = dict(
                restaurant=restaurant,
                title=offer_title,
                description=description,
                offer_type=offer_type,
                start_date=start_date,
                end_date=end_date,
                start_time=datetime.time(hour,0,0),
                end_time=datetime.time((hour+1)%24,0,0),
                is_active=True,
                available_quantity=available_quantity,
                max_people_per_booking=max_people_per_booking,
                min_advance_booking=min_advance_booking,
            )
            if days_of_week:
                offer_kwargs['days_of_week']=days_of_week
            if offer_type=='percentage':
                # Use max of pattern percentages as headline (optional), else first
                pattern = per_hour_patterns.get(str(hour), base_pattern)
                headline = max([p['discount_percentage'] for p in pattern if p['discount_percentage'] is not None]) if pattern else None
                offer_kwargs['discount_percentage']=headline
            else:
                pattern = per_hour_patterns.get(str(hour), base_pattern)
                if pattern:
                    # Use max discount amount across pattern as headline
                    max_amt = None
                    for p in pattern:
                        da = p.get('discount_amount')
                        if da is not None:
                            if max_amt is None or da > max_amt:
                                max_amt = da
                    offer_kwargs['discount_amount']=max_amt
            if original_price is not None:
                offer_kwargs['original_price']=original_price
            offer = Offer.objects.create(**offer_kwargs)
            # Create time slots
            pattern = per_hour_patterns.get(str(hour), base_pattern) or []
            for entry in pattern:
                minute = entry['minute']
                st = datetime.time(hour, minute,0)
                et_minute = 30 if minute==0 else 0
                et_hour = hour if minute==0 else (hour+1)%24
                et = datetime.time(et_hour, et_minute,0)
                OfferTimeSlot.objects.create(
                    offer=offer,
                    restaurant=restaurant,
                    start_time=st,
                    end_time=et,
                    discount_percentage=entry.get('discount_percentage'),
                    discount_amount=entry.get('discount_amount'),
                    is_active=True,
                )
            created.append({'id':offer.id,'hour':hour})

        return Response({
            'created_count': len(created),
            'created': created,
            'skipped_existing': skipped,
            'deleted_replaced': deleted,
            'restaurant_id': restaurant.id,
            'date_range': {'start': start_date.isoformat(),'end': end_date.isoformat()}
        })

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Booking.objects.none()
        # Admin/staff get everything
        if getattr(user, 'is_staff', False) or getattr(user, 'user_type', '') == 'admin':
            return Booking.objects.all()
        # Restaurant owners: bookings for their restaurants (direct or via offers) + their diner bookings
        if getattr(user, 'user_type', '') == 'restaurant_owner':
            return Booking.objects.filter(
                Q(restaurant__owner=user) | Q(offer__restaurant__owner=user) | Q(diner=user)
            ).distinct()
        # Diners: only their bookings
        return Booking.objects.filter(diner=user)

    def perform_create(self, serializer):
        offer = serializer.validated_data.get('offer', None)
        restaurant = serializer.validated_data.get('restaurant', None)
        # If only offer is provided, set restaurant from offer
        if offer and not restaurant:
            restaurant = offer.restaurant
        # Slot validation: if slot provided, enforce constraints atomically
        from django.utils import timezone
        from django.db import transaction
        slot = serializer.validated_data.get('slot')
        booking_time = serializer.validated_data.get('booking_time')
        party_size = serializer.validated_data.get('number_of_people', 1)
        if slot and restaurant and slot.restaurant_id != restaurant.id:
            raise serializers.ValidationError({'slot': 'Slot does not belong to specified restaurant.'})
        if slot:
            # Atomic capacity & status check
            with transaction.atomic():
                # Lock slot row
                slot_locked = BookingSlot.objects.select_for_update().get(id=slot.id)
                status_eff = slot_locked.effective_status()
                if status_eff != 'open':
                    raise serializers.ValidationError({'slot': f'Slot not bookable (status={status_eff}).'})
                if party_size < slot_locked.min_party_size or party_size > slot_locked.max_party_size:
                    raise serializers.ValidationError({'slot': 'Party size not allowed for this slot.'})
                rc = slot_locked.remaining_capacity
                if rc is not None and rc - party_size < 0:
                    raise serializers.ValidationError({'slot': 'Slot capacity exceeded.'})
                # Ensure booking_time matches slot start
                if booking_time:
                    local_tz = timezone.get_current_timezone()
                    local_dt = timezone.localtime(booking_time, local_tz)
                    if local_dt.date() != slot_locked.date or local_dt.time().replace(second=0, microsecond=0) != slot_locked.start_time:
                        raise serializers.ValidationError({'booking_time': 'booking_time must match slot start time.'})
                serializer.save(diner=self.request.user, restaurant=restaurant or slot.restaurant)
                return
        else:
            # Legacy path: derive slot if exists for booking_time
            if booking_time and restaurant:
                local_tz = timezone.get_current_timezone()
                local_dt = timezone.localtime(booking_time, local_tz)
                inferred_slot = BookingSlot.objects.filter(
                    restaurant=restaurant,
                    date=local_dt.date(),
                    start_time=local_dt.time().replace(second=0, microsecond=0)
                ).first()
                if inferred_slot:
                    serializer.validated_data['slot'] = inferred_slot
            serializer.save(diner=self.request.user, restaurant=restaurant)

class BookingSlotAvailabilityViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only availability for booking slots; filtered by restaurant, date, party size, granularity."""
    queryset = BookingSlot.objects.select_related('restaurant')
    serializer_class = BookingSlotSerializer
    http_method_names = ['get']

    def list(self, request, *args, **kwargs):
        from django.utils import timezone
        import datetime
        restaurant_id = request.query_params.get('restaurant')
        date_str = request.query_params.get('date')
        party_size = int(request.query_params.get('party_size', '1'))
        granularity = int(request.query_params.get('granularity', '30'))
        if not restaurant_id or not date_str:
            return Response({'error': 'restaurant and date are required'}, status=400)
        try:
            target_date = datetime.date.fromisoformat(date_str)
        except ValueError:
            return Response({'error': 'Invalid date format (YYYY-MM-DD)'}, status=400)
        slots = BookingSlot.objects.filter(restaurant_id=restaurant_id, date=target_date, is_active=True)
        # Build response with effective status filtered for party size
        data = []
        for slot in slots:
            status_eff = slot.effective_status()
            if party_size < slot.min_party_size or party_size > slot.max_party_size:
                status_override = 'closed'
            else:
                status_override = status_eff
            rem_cap = slot.remaining_capacity
            if rem_cap is not None and rem_cap <= 0:
                status_override = 'full'
            ser = BookingSlotSerializer(slot, context={'request': request}).data
            ser['effective_status'] = status_override
            data.append(ser)
        # Optionally could fill missing granular slots here.
        return Response({'slots': data, 'restaurant_id': int(restaurant_id), 'date': target_date.isoformat(), 'granularity': granularity})

from rest_framework.views import APIView

class AvailabilityView(APIView):
    """GET /api/availability/?slot_id=…&party_size=…"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slot_id = request.query_params.get('slot_id')
        party_size = int(request.query_params.get('party_size', '1'))
        if not slot_id:
            return Response({'error': 'slot_id required'}, status=400)
        try:
            slot = BookingSlot.objects.get(id=int(slot_id))
        except (ValueError, BookingSlot.DoesNotExist):
            return Response({'available': False, 'remaining': 0})
        status_eff = slot.effective_status()
        rem = slot.remaining_capacity
        avail = status_eff == 'open' and (rem is None or rem >= party_size)
        remaining = (rem if rem is not None else 99)
        return Response(AvailabilitySerializer({'available': avail, 'remaining': remaining}).data)

class BookingSlotViewSet(viewsets.ModelViewSet):
    """CRUD for BookingSlots (restaurant owner for own restaurants or admin)."""
    queryset = BookingSlot.objects.select_related('restaurant')
    serializer_class = BookingSlotSerializer
    filterset_fields = ['restaurant','date']
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user,'user_type','') == 'admin' or user.is_staff:
            return qs
        # Restrict to slots of restaurants owned by user
        return qs.filter(restaurant__owner=user)

    def perform_create(self, serializer):
        user = self.request.user
        restaurant = serializer.validated_data.get('restaurant')
        if not restaurant:
            raise serializers.ValidationError({'restaurant':'Required'})
        if not (getattr(user,'user_type','') == 'admin' or user.is_staff or restaurant.owner_id == user.id):
            raise serializers.ValidationError({'permission':'Not allowed to create slot for this restaurant'})
        serializer.save()

    def perform_update(self, serializer):
        self.perform_create(serializer)  # same permission logic

    def perform_destroy(self, instance):
        user = self.request.user
        if not (getattr(user,'user_type','') == 'admin' or user.is_staff or instance.restaurant.owner_id == user.id):
            raise serializers.ValidationError({'permission':'Not allowed to delete slot'})
        return super().perform_destroy(instance)


class BookingHoldViewSet(viewsets.ModelViewSet):
    """Create/Destroy booking holds. Lookup by hold_id to match API spec."""
    queryset = BookingHold.objects.select_related('slot')
    serializer_class = BookingHoldSerializer
    http_method_names = ['post', 'delete']
    lookup_field = 'hold_id'
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # avoid SessionAuthentication CSRF for public POST

    def create(self, request, *args, **kwargs):
        from django.utils import timezone
        from django.db import transaction
        slot_id = request.data.get('slot_id')
        party_size = int(request.data.get('party_size') or 1)
        contact = request.data.get('contact') or {}
        if not slot_id:
            return Response({'error': 'slot_id required'}, status=400)
        try:
            with transaction.atomic():
                slot = BookingSlot.objects.select_for_update().get(id=int(slot_id))
                status_eff = slot.effective_status()
                rem = slot.remaining_capacity
                if status_eff != 'open' or (rem is not None and rem < party_size):
                    return Response({'error': 'Slot not available'}, status=409)
                import secrets
                hold_id = secrets.token_urlsafe(8)
                expires_at = timezone.now() + timezone.timedelta(minutes=10)
                hold = BookingHold.objects.create(
                    hold_id=hold_id, slot=slot, party_size=party_size, contact=contact, expires_at=expires_at, status='active'
                )
        except (ValueError, BookingSlot.DoesNotExist):
            return Response({'error': 'slot not found'}, status=404)
        # Basic price calc if slot or offer discount exists is out of scope; return placeholder price fields
        price = {'original': 0.0, 'discount': 0.0, 'final': 0.0}
        data = {'hold_id': hold.hold_id, 'expires_at': hold.expires_at, 'price': price}
        return Response(data, status=201)

    def destroy(self, request, *args, **kwargs):
        hold = self.get_object()
        hold.status = 'released'
        hold.save(update_fields=['status'])
        return Response(status=204)


class BookingConfirmView(APIView):
    """POST /api/bookings/confirm/ with hold_id to finalize booking.

    Note: We previously disabled all authentication classes here to avoid CSRF issues
    with SessionAuthentication for anonymous bookings. That prevented TokenAuthentication
    from running, so even authenticated users (sending an Authorization header) were
    treated as Anonymous and the resulting Booking.diner field was left null. Those
    bookings then failed to appear in the user's /api/bookings/ list (which filters
    by diner=request.user for normal diners).

    Fix: Re-enable token authentication only (no SessionAuthentication) so supplying
    a token links the booking to the diner while still allowing anonymous bookings
    (permission_classes = AllowAny). Anonymous users can still confirm; authenticated
    users will now see their confirmed bookings under "Upcoming".
    """
    from rest_framework.authentication import TokenAuthentication  # local import to avoid top churn
    permission_classes = [permissions.AllowAny]
    authentication_classes = [TokenAuthentication]  # allow token-based user association without CSRF hassles

    def post(self, request):
        from django.utils import timezone
        hold_id = request.data.get('hold_id')
        if not hold_id:
            return Response({'error': 'hold_id required'}, status=400)
        try:
            hold = BookingHold.objects.select_related('slot').get(hold_id=hold_id)
        except BookingHold.DoesNotExist:
            return Response({'error': 'Hold not found'}, status=404)
        # Validate not expired
        if hold.status != 'active' or hold.expires_at <= timezone.now():
            return Response({'error': 'Hold expired or invalid'}, status=409)
        # Create a Booking record (anonymous diner allowed -> no diner linkage)
        slot = hold.slot
        # Generate a code
        import secrets
        code = secrets.token_hex(2).upper() + '-' + secrets.token_hex(2).upper()
        from django.db import IntegrityError
        try:
            b = Booking.objects.create(
                diner=request.user if request.user.is_authenticated else None,  # type: ignore
                restaurant=slot.restaurant,
                slot=slot,
                booking_time=timezone.make_aware(timezone.datetime.combine(slot.date, slot.start_time), timezone.get_current_timezone()),
                number_of_people=hold.party_size,
                status='confirmed'
            )
        except IntegrityError as e:
            # Likely due to diner field being non-nullable in DB. Surface a helpful message.
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"IntegrityError creating booking for hold {hold_id}: {e}")
            return Response({'error': 'Booking could not be confirmed due to server configuration. Please run database migrations to allow guest bookings (make Booking.diner nullable).', 'detail': str(e)}, status=500)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected error creating booking for hold {hold_id}: {e}")
            return Response({'error': 'Unexpected error during booking confirmation.', 'detail': str(e)}, status=500)
        # Attach booking reference into hold.contact so downstream serializers can surface contact details
        contact = hold.contact or {}
        try:
            # avoid mutating original dict if it's shared
            contact = dict(contact)
        except Exception:
            pass
        contact['booking_id'] = b.id
        hold.contact = contact
        hold.status = 'confirmed'
        hold.save(update_fields=['status', 'contact'])
        return Response({'booking_id': str(b.id), 'code': code, 'status': 'confirmed'})

# Admin-specific views
class AdminRestaurantViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for managing restaurants with additional functionality
    """
    queryset = Restaurant.objects.all().select_related('owner').prefetch_related('offers')
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'cuisine_type', 'address', 'owner__username', 'owner__email']
    filterset_fields = ['cuisine_type', 'price_range', 'is_active', 'is_featured', 'owner']
    ordering_fields = ['name', 'rating', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminRestaurantCreateUpdateSerializer
        return AdminRestaurantSerializer

    @action(detail=False, methods=['get'])
    def owner_candidates(self, request):
        """List users eligible to become restaurant owners (user_type=restaurant_owner)."""
        owners = User.objects.filter(user_type='restaurant_owner').order_by('username')
        data = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
            }
            for u in owners
        ]
        return Response(data)

    @action(detail=True, methods=['post'])
    def transfer_owner(self, request, pk=None):
        """Transfer ownership of a restaurant to another user (admin-only).

        Request body:
        { "new_owner_id": <int> }

        Rules:
        - new_owner_id must exist.
        - Target user must have user_type == 'restaurant_owner'.
        - Returns updated owner info.
        """
        restaurant = self.get_object()
        new_owner_id = request.data.get('new_owner_id')
        if not new_owner_id:
            return Response({'error': 'new_owner_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_owner = User.objects.get(id=new_owner_id)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        if getattr(new_owner, 'user_type', '') != 'restaurant_owner':
            return Response({'error': 'New owner must have user_type "restaurant_owner".'}, status=status.HTTP_400_BAD_REQUEST)
        old_owner_id = restaurant.owner_id
        restaurant.owner = new_owner
        restaurant.save(update_fields=['owner'])
        return Response({
            'message': 'Ownership transferred successfully.',
            'restaurant_id': restaurant.id,
            'old_owner_id': old_owner_id,
            'new_owner_id': new_owner.id,
            'new_owner_username': new_owner.username
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        total_restaurants = Restaurant.objects.count()
        active_restaurants = Restaurant.objects.filter(is_active=True).count()
        featured_restaurants = Restaurant.objects.filter(is_featured=True).count()
        total_offers = Offer.objects.count()
        total_bookings = Booking.objects.count()
        
        # Restaurants by cuisine type
        cuisine_stats = Restaurant.objects.values('cuisine_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_restaurants': total_restaurants,
            'active_restaurants': active_restaurants,
            'featured_restaurants': featured_restaurants,
            'total_offers': total_offers,
            'total_bookings': total_bookings,
            'cuisine_stats': cuisine_stats
        })

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of a restaurant"""
        restaurant = self.get_object()
        restaurant.is_featured = not restaurant.is_featured
        restaurant.save()
        return Response({
            'message': f'Restaurant {"featured" if restaurant.is_featured else "unfeatured"} successfully',
            'is_featured': restaurant.is_featured
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of a restaurant"""
        restaurant = self.get_object()
        restaurant.is_active = not restaurant.is_active
        restaurant.save()
        return Response({
            'message': f'Restaurant {"activated" if restaurant.is_active else "deactivated"} successfully',
            'is_active': restaurant.is_active
        })

    @action(detail=False, methods=['get'])
    def bulk_actions(self, request):
        """Get available bulk actions"""
        return Response({
            'actions': [
                {'key': 'activate', 'label': 'Activate Selected'},
                {'key': 'deactivate', 'label': 'Deactivate Selected'},
                {'key': 'feature', 'label': 'Feature Selected'},
                {'key': 'unfeature', 'label': 'Unfeature Selected'},
                {'key': 'delete', 'label': 'Delete Selected'}
            ]
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Perform bulk actions on multiple restaurants"""
        action_type = request.data.get('action')
        restaurant_ids = request.data.get('restaurant_ids', [])
        
        if not action_type or not restaurant_ids:
            return Response(
                {'error': 'Action and restaurant_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restaurants = Restaurant.objects.filter(id__in=restaurant_ids)
        
        if action_type == 'activate':
            restaurants.update(is_active=True)
            message = f'{restaurants.count()} restaurants activated'
        elif action_type == 'deactivate':
            restaurants.update(is_active=False)
            message = f'{restaurants.count()} restaurants deactivated'
        elif action_type == 'feature':
            restaurants.update(is_featured=True)
            message = f'{restaurants.count()} restaurants featured'
        elif action_type == 'unfeature':
            restaurants.update(is_featured=False)
            message = f'{restaurants.count()} restaurants unfeatured'
        elif action_type == 'delete':
            count = restaurants.count()
            restaurants.delete()
            message = f'{count} restaurants deleted'
        else:
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message})


class AdminOfferViewSet(viewsets.ModelViewSet):
    """
    Admin-only CRUD for offers. Staff can create, edit, and delete offers for any restaurant.
    """
    queryset = Offer.objects.all().select_related('restaurant')
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    serializer_class = OfferSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description', 'restaurant__name']
    filterset_fields = ['restaurant', 'offer_type', 'is_active', 'is_featured', 'recurring']
    ordering_fields = ['created_at', 'updated_at', 'start_date', 'end_date', 'discount_percentage', 'discount_amount']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def by_restaurant(self, request):
        """List offers for a specific restaurant id."""
        restaurant_id = request.query_params.get('restaurant')
        if not restaurant_id:
            return Response({'error': 'restaurant query param required'}, status=status.HTTP_400_BAD_REQUEST)
        qs = self.queryset.filter(restaurant_id=restaurant_id)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Admin bulk actions on offers (activate/deactivate/feature/unfeature/delete)."""
        action_type = request.data.get('action')
        offer_ids = request.data.get('offer_ids', [])
        if not action_type or not offer_ids:
            return Response({'error': 'action and offer_ids are required'}, status=status.HTTP_400_BAD_REQUEST)
        offers = Offer.objects.filter(id__in=offer_ids)
        if action_type == 'activate':
            offers.update(is_active=True)
            msg = f"{offers.count()} offers activated"
        elif action_type == 'deactivate':
            offers.update(is_active=False)
            msg = f"{offers.count()} offers deactivated"
        elif action_type == 'feature':
            offers.update(is_featured=True)
            msg = f"{offers.count()} offers featured"
        elif action_type == 'unfeature':
            offers.update(is_featured=False)
            msg = f"{offers.count()} offers unfeatured"
        elif action_type == 'delete':
            count = offers.count()
            offers.delete()
            msg = f"{count} offers deleted"
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': msg})