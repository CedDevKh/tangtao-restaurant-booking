from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_offer_days_of_week_offer_end_date_offer_is_featured_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='BookingSlot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('discount_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('capacity', models.PositiveIntegerField(default=0, help_text='Max total guests for this slot (0 = unlimited)')),
                ('min_party_size', models.PositiveIntegerField(default=1)),
                ('max_party_size', models.PositiveIntegerField(default=20)),
                ('rules', models.JSONField(blank=True, default=dict, help_text="Arbitrary rule metadata e.g. {'excludes': 'alcohol'}")),
                ('status', models.CharField(choices=[('open', 'Open'), ('closed', 'Closed'), ('full', 'Full')], default='open', max_length=10)),
                ('lead_time_minutes', models.PositiveIntegerField(default=60, help_text='Minimum minutes before start required for booking')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('restaurant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='slots', to='marketplace.restaurant')),
            ],
            options={
                'verbose_name': 'Booking Slot',
                'verbose_name_plural': 'Booking Slots',
                'ordering': ['date', 'start_time'],
                'unique_together': {('restaurant', 'date', 'start_time')},
            },
        ),
    ]
