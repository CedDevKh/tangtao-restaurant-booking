import os
import uuid
import requests
from django.core.files.base import ContentFile
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Restaurant

TIMEOUT = 10
ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

def _download_image(url: str):
    try:
        resp = requests.get(url, timeout=TIMEOUT, stream=True)
        ct = resp.headers.get("Content-Type", "").lower()
        if resp.status_code != 200:
            return None, None
        ext = None
        for k, v in ALLOWED_CONTENT_TYPES.items():
            if k in ct:
                ext = v
                break
        if not ext:
            # Try to infer from URL
            for e in ('.jpg', '.jpeg', '.png', '.webp'):
                if url.lower().endswith(e):
                    ext = e if e.startswith('.') else f'.{e}'
                    break
        if not ext:
            return None, None
        content = resp.content
        return content, ext
    except Exception:
        return None, None

@receiver(post_save, sender=Restaurant)
def fetch_restaurant_cover(sender, instance: Restaurant, created, **kwargs):
    """Download remote image_url once and store into image_file if empty.

    Only runs when: image_url present, image_file empty, and protocol is http/https.
    """
    if not instance.image_url or instance.image_file:
        return
    url = instance.image_url.strip()
    if not (url.startswith('http://') or url.startswith('https://')):
        return
    content, ext = _download_image(url)
    if not content or not ext:
        return
    filename = f"{uuid.uuid4().hex}{ext}"
    try:
        instance.image_file.save(filename, ContentFile(content), save=True)
    except Exception:
        # Silent fail—retain original image_url
        pass
