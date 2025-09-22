from django.core.management.base import BaseCommand
from django.db import transaction
from marketplace.models import Restaurant


class Command(BaseCommand):
    help = "Backfill local image_file for restaurants that have image_url but no downloaded file yet."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=None, help='Optional max number of restaurants to process')
        parser.add_argument('--dry-run', action='store_true', help='Show which restaurants would be processed without saving')
        parser.add_argument('--force', action='store_true', help='Re-download even if image_file already exists')

    def handle(self, *args, **options):
        limit = options.get('limit')
        dry_run = options.get('dry_run')
        force = options.get('force')

        qs = Restaurant.objects.all()
        if force:
            targets = [r for r in qs if r.image_url]
        else:
            targets = [r for r in qs if r.image_url and not r.image_file]
        if limit:
            targets = targets[:limit]

        total = len(targets)
        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run: {total} restaurants would be processed."))
            for r in targets[:20]:  # sample
                self.stdout.write(f" - {r.id}: {r.name}")
            if total > 20:
                self.stdout.write(f" ... ({total-20} more)")
            return

        processed = 0
        for r in targets:
            # Trigger the post_save signal logic by calling save() inside a transaction (only updating needed fields)
            with transaction.atomic():
                if force and r.image_file:
                    # Clear to force re-download
                    r.image_file.delete(save=False)
                    r.image_file = None
                r.save(update_fields=['updated_at'] if hasattr(r, 'updated_at') else None)  # touches row to invoke signal
            processed += 1
            if processed % 25 == 0:
                self.stdout.write(f"Processed {processed}/{total}...")

        self.stdout.write(self.style.SUCCESS(f"Completed backfill: {processed} restaurants processed."))
