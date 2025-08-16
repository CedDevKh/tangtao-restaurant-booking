import json, os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.core.settings')
django.setup()
from django.test import Client
from users.models import User
from marketplace.models import Restaurant
from rest_framework.authtoken.models import Token
u = User.objects.filter(is_staff=True).first() or User.objects.first()
if not u:
    print('No user'); exit()
Token.objects.get_or_create(user=u)
rest = Restaurant.objects.first()
if not rest:
    print('No restaurant'); exit()
payload={'restaurant':rest.id,'offer_type':'percentage','title_template':'Test {hour}:00','description':'Auto','start_date':'2025-08-16','end_date':'2025-08-23','hours':[11,12],'slots_pattern':[{'minute':0,'discount_percentage':50},{'minute':30,'discount_percentage':40}],'replace':True,'available_quantity':5}
client=Client(HTTP_AUTHORIZATION=f'Token {u.auth_token.key}')
resp=client.post('/api/offers/generate_schedule/', data=json.dumps(payload), content_type='application/json')
print('Status', resp.status_code)
print(resp.content.decode()[:500])
