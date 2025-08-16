from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0007_bookingslot'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='slot',
            field=models.ForeignKey(blank=True, help_text='The concrete BookingSlot reserved (if using slot system)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='slot_bookings', to='marketplace.bookingslot'),
        ),
    ]
