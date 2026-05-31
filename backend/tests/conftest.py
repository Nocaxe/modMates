import json
import os

TEST_PUBLIC_KEY={
    'alg': 'ES256', 'kty': 'EC', 'crv': 'P-256',
    'x': 'T1OP2vBepmNPcGbW3DFibgyTQwHb0QIIU4xHdkvZHkY', 
    'y': 'obgy5Buh7F0W3ts3pc2-WuuefQJRl6yWW4fXPvtlNK8'
}

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SUPABASE_PUBLIC_KEY", json.dumps({"keys": [TEST_PUBLIC_KEY]}))