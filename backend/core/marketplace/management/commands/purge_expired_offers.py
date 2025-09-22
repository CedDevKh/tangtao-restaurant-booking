from django.core.management.base import BaseCommand
from django.utils import timezone
from marketplace.models import Offer


class Command(BaseCommand):
    help = "Delete or deactivate offers past their end_date. If bookings exist, deactivate instead of delete."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would happen without modifying the database.",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)
        today = timezone.localdate()
        expired = Offer.objects.filter(end_date__lt=today)
        deleted = 0
        deactivated = 0

        for offer in expired:
            has_bookings = offer.bookings.exists()
            if has_bookings:
                if not offer.is_active:
                    continue
                if dry_run:
                    self.stdout.write(f"Would deactivate offer {offer.id} - {offer}")
                else:
                    offer.is_active = False
                    offer.save(update_fields=["is_active", "updated_at"])
                    deactivated += 1
            else:
                if dry_run:
                    self.stdout.write(f"Would delete offer {offer.id} - {offer}")
                else:
                    offer.delete()
                    deleted += 1

        summary = f"Expired offers processed. Deleted: {deleted}, Deactivated: {deactivated}."
        self.stdout.write(self.style.SUCCESS(summary))
