from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from django.urls import reverse
from django.utils import timezone
from .models import Restaurant, Offer
import datetime


class AdminOfferApiTests(TestCase):
	def setUp(self):
		self.User = get_user_model()
		self.admin = self.User.objects.create_user(
			username="admin", password="pass", is_staff=True, user_type="admin"
		)
		self.owner = self.User.objects.create_user(
			username="owner", password="pass", user_type="restaurant_owner"
		)
		self.diner = self.User.objects.create_user(
			username="diner", password="pass", user_type="diner"
		)
		self.restaurant = Restaurant.objects.create(
			owner=self.owner,
			name="Test Resto",
			address="123 Street",
			cuisine_type="other",
			price_range=2,
			capacity=100,
		)
		self.client = APIClient()

	def _valid_offer_payload(self):
		today = timezone.localdate()
		return {
			"restaurant": self.restaurant.id,
			"title": "Happy Hour",
			"description": "Drinks discount",
			"offer_type": "percentage",
			"discount_percentage": 25,
			"start_date": today.isoformat(),
			"end_date": (today + datetime.timedelta(days=7)).isoformat(),
			"start_time": "18:00:00",
			"end_time": "19:00:00",
			"recurring": "none",
			"available_quantity": 50,
			"max_people_per_booking": 6,
			"min_advance_booking": 1,
			"is_active": True,
			"is_featured": False,
		}

	def test_admin_can_crud_offers_via_admin_api(self):
		self.client.force_authenticate(user=self.admin)
		# Create
		resp = self.client.post("/api/admin/offers/", self._valid_offer_payload(), format="json")
		self.assertEqual(resp.status_code, 201, resp.content)
		offer_id = resp.data.get("id")
		self.assertTrue(offer_id)

		# Update (partial)
		resp = self.client.patch(f"/api/admin/offers/{offer_id}/", {"title": "Even Happier Hour"}, format="json")
		self.assertEqual(resp.status_code, 200, resp.content)
		self.assertEqual(resp.data.get("title"), "Even Happier Hour")

		# List by restaurant
		resp = self.client.get(f"/api/admin/offers/by_restaurant/?restaurant={self.restaurant.id}")
		self.assertEqual(resp.status_code, 200)
		self.assertGreaterEqual(len(resp.data), 1)

		# Delete
		resp = self.client.delete(f"/api/admin/offers/{offer_id}/")
		self.assertEqual(resp.status_code, 204, resp.content)
		self.assertFalse(Offer.objects.filter(id=offer_id).exists())

	def test_non_admin_forbidden_on_admin_offers(self):
		self.client.force_authenticate(user=self.diner)
		resp = self.client.post("/api/admin/offers/", self._valid_offer_payload(), format="json")
		self.assertEqual(resp.status_code, 403)

