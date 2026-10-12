#!/usr/bin/env python3
"""Local-only server. Uses installed models; never sends images to a third party."""
import base64,json,os,pathlib,subprocess,sys,tempfile,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse,parse_qs
ROOT=pathlib.Path(__file__).resolve().parent
LOCK=threading.Lock()
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
 def json(self,code,value):
  b=json.dumps(value).encode();self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(b)));self.end_headers();self.wfile.write(b)
 def do_GET(self):
  parsed=urlparse(self.path)
  if parsed.path=='/api/process.php':
   self.json(200,dict(success=True,remove=(ROOT/'models/u2net.onnx').exists(),upscale=(ROOT/'models/realesr-general-x4v3.onnx').exists()));return
  if parsed.path.startswith(('/api/','/models/')) or parsed.path in ['/server.py','/README.md']:self.send_error(403);return
  super().do_GET()
 def do_POST(self):
  parsed=urlparse(self.path);q=parse_qs(parsed.query);action=q.get('action',[''])[0];mode=q.get('mode',['neural'])[0]
  if parsed.path!='/api/process.php' or action not in ['remove','upscale'] or mode not in ['auto','neural','corners']:self.json(400,{'error':'action'});return
  length=int(self.headers.get('Content-Length','0'))
  if length<1 or length>32*1024*1024:self.json(413,{'error':'size'});return
  if not LOCK.acquire(False):self.json(429,{'error':'busy'});return
  try:
   from PIL import Image
   with tempfile.TemporaryDirectory(prefix='oneclick-') as folder:
    source=pathlib.Path(folder)/'input.png';target=pathlib.Path(folder)/'output.png';source.write_bytes(self.rfile.read(length))
    with Image.open(source) as img:
     w,h=img.size
     if img.format!='PNG' or w*h>(1500000 if action=='upscale' else 12000000):self.json(413,{'error':'pixels'});return
    args=[sys.executable,str(ROOT/'api'/('upscale.py' if action=='upscale' else 'remove_bg.py')),str(source),str(target)]
    if action=='remove':args.extend([mode,'35'])
    result=subprocess.run(args,capture_output=True,timeout=240,text=True)
    try:answer=json.loads(result.stdout)
    except Exception:answer={}
    if result.returncode or not answer.get('success'):self.json(503,{'error':'model'});return
    self.json(200,dict(success=True,image='data:image/png;base64,'+base64.b64encode(target.read_bytes()).decode(),method='Real-ESRGAN 4x' if action=='upscale' else 'U²-Net',width=answer['width'],height=answer['height']))
  except subprocess.TimeoutExpired:self.json(504,{'error':'timeout'})
  except (BrokenPipeError,ConnectionResetError):pass
  except Exception as e:print(type(e).__name__,file=sys.stderr);self.json(503,{'error':'runtime'})
  finally:LOCK.release()
if __name__=='__main__':
 port=int(sys.argv[1]) if len(sys.argv)>1 else 8775
 server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
 print('OneClick AI: http://127.0.0.1:'+str(port),flush=True)
 server.serve_forever()
