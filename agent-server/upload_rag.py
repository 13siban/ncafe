import urllib.request
import json

def test():
    with open('/home/young/workspace/ncafe/메뉴명_영문가이드.md', 'r', encoding='utf-8') as f:
        content = f.read()

    data = {
        "filename": "메뉴명_영문가이드.md",
        "content": content,
        "metadata": {}
    }
    req = urllib.request.Request('http://localhost:8000/api/vector/ingest', data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        print(response.read().decode('utf-8'))
    except Exception as e:
        print(e)
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))

if __name__ == "__main__":
    test()
