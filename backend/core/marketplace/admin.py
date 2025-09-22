from django.contrib import admin
from .models import Restaurant, Offer, OfferTimeSlot, Booking, BookingSlot, BookingHold


class OfferTimeSlotInline(admin.TabularInline):
	model = OfferTimeSlot
	extra = 1
	fields = ("start_time", "end_time", "discount_percentage", "discount_amount", "is_active")


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"title",
		"restaurant",
		"offer_type",
		"discount_percentage",
		"discount_amount",
		"start_date",
		"end_date",
		"is_active",
		"is_featured",
		"created_at",
	)
	list_filter = ("is_active", "is_featured", "offer_type", "restaurant")
	search_fields = ("title", "description", "restaurant__name")
	autocomplete_fields = ("restaurant",)
	inlines = [OfferTimeSlotInline]


class OfferInline(admin.TabularInline):
	model = Offer
	extra = 0
	fields = ("title", "offer_type", "discount_percentage", "discount_amount", "start_date", "end_date", "is_active")


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "owner", "cuisine_type", "price_range", "is_active", "is_featured")
	list_filter = ("is_active", "is_featured", "cuisine_type", "price_range")
	search_fields = ("name", "address", "owner__username", "owner__email")
	autocomplete_fields = ("owner",)
	inlines = [OfferInline]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
	list_display = ("id", "diner", "restaurant", "offer", "slot", "booking_time", "number_of_people", "status")
	list_filter = ("status", "restaurant")
	search_fields = ("diner__username", "restaurant__name", "offer__title")
	autocomplete_fields = ("diner", "restaurant", "offer", "slot")


@admin.register(BookingSlot)
class BookingSlotAdmin(admin.ModelAdmin):
	list_display = ("id", "restaurant", "date", "start_time", "end_time", "capacity", "status", "is_active")
	list_filter = ("restaurant", "date", "status", "is_active")
	search_fields = ("restaurant__name",)
	autocomplete_fields = ("restaurant",)


@admin.register(BookingHold)
class BookingHoldAdmin(admin.ModelAdmin):
	list_display = ("hold_id", "slot", "party_size", "status", "expires_at", "created_at")
	list_filter = ("status",)
	search_fields = ("hold_id",)
	autocomplete_fields = ("slot",)


@admin.register(OfferTimeSlot)
class OfferTimeSlotAdmin(admin.ModelAdmin):
	list_display = ("id", "offer", "restaurant", "start_time", "end_time", "discount_percentage", "discount_amount", "is_active")
	list_filter = ("is_active", "restaurant")
	search_fields = ("offer__title", "restaurant__name")
	autocomplete_fields = ("offer", "restaurant")

