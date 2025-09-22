from django.apps import AppConfig
import os
import sys
import threading
import logging


class MarketplaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'marketplace'

    def ready(self):  # noqa: D401
        # Import signals so post_save handler registers
        from . import signals  # pylint: disable=unused-import

    _startup_purge_ran = False

    def ready(self):
        """On backend start, purge expired offers once.

        Guards:
        - Only when running the web server (runserver/gunicorn)
        - Avoid double run on Django autoreload (RUN_MAIN)
        - Run in background thread to not block startup
        """
        try:
            from django.conf import settings
        except Exception:
            return

        # Feature flag (enabled by default)
        if not getattr(settings, 'PURGE_EXPIRED_OFFERS_ON_START', True):
            return

        # Avoid multiple runs per process
        if MarketplaceConfig._startup_purge_ran:
            return

        argv = sys.argv or []
        is_server = any(cmd in argv for cmd in ('runserver', 'gunicorn', 'uwsgi'))
        if not is_server:
            return

        # In runserver, run only in the reloader child process
        if 'runserver' in argv and os.environ.get('RUN_MAIN') != 'true':
            return

        # Mark as executed for this process
        MarketplaceConfig._startup_purge_ran = True

        logger = logging.getLogger(__name__)

        def _purge_task():
            try:
                from django.core.management import call_command
                logger.info('Purging expired offers on startup...')
                call_command('purge_expired_offers')
                logger.info('Purge complete.')
            except Exception as e:
                logger.error(f'purge_expired_offers failed: {e}')

        # Fire-and-forget to avoid blocking startup
        threading.Thread(target=_purge_task, daemon=True).start()
