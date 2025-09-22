from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0009_offertimeslot'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='latitude',
            field=models.DecimalField(blank=True, null=True, max_digits=9, decimal_places=6),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='longitude',
            field=models.DecimalField(blank=True, null=True, max_digits=9, decimal_places=6),
        ),
    ]
