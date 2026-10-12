<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function fail($code,$message){http_response_code($code);echo json_encode(['error'=>$message]);exit;}
$python=getenv('ONECLICK_PYTHON')?:(is_executable('/opt/ai_upscaler/upscale_env/bin/python')?'/opt/ai_upscaler/upscale_env/bin/python':'/usr/bin/python3');
$action=$_GET['action']??'';
if($_SERVER['REQUEST_METHOD']==='GET'&&$action==='status'){echo json_encode(['success'=>true,'remove'=>is_file(__DIR__.'/../models/u2net.onnx'),'upscale'=>is_file(__DIR__.'/../models/realesr-general-x4v3.onnx')]);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST')fail(405,'method');
if(!in_array($action,['remove','upscale'],true))fail(400,'action');
if((int)($_SERVER['CONTENT_LENGTH']??0)>32*1024*1024)fail(413,'size');
$bytes=file_get_contents('php://input',false,null,0,32*1024*1024+1);
if(strlen($bytes)>32*1024*1024)fail(413,'size');
$info=@getimagesizefromstring($bytes);if(!$info||$info[2]!==IMAGETYPE_PNG)fail(400,'image');
$limit=$action==='upscale'?1500000:12000000;
if($info[0]*$info[1]>$limit)fail(413,'pixels');
$lock=fopen(sys_get_temp_dir().'/oneclick-ai.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))fail(429,'busy');
$in=tempnam(sys_get_temp_dir(),'oc-in-');$out=tempnam(sys_get_temp_dir(),'oc-out-');
try{file_put_contents($in,$bytes);$mode=$_GET['mode']??'neural';if(!in_array($mode,['auto','neural','corners'],true))throw new Exception('mode');
$command=[$python,__DIR__.($action==='upscale'?'/upscale.py':'/remove_bg.py'),$in,$out];if($action==='remove'){$command[]=$mode;$command[]='35';}
$process=proc_open($command,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes);if(!is_resource($process))throw new Exception('runtime');fclose($pipes[0]);stream_set_blocking($pipes[1],false);stream_set_blocking($pipes[2],false);$stdout='';$stderr='';$deadline=microtime(true)+240;
try{do{$stdout.=stream_get_contents($pipes[1]);$stderr.=stream_get_contents($pipes[2]);$state=proc_get_status($process);if(!$state['running'])break;if(microtime(true)>$deadline){proc_terminate($process,9);throw new Exception('timeout');}usleep(30000);}while(true);$stdout.=stream_get_contents($pipes[1]);$stderr.=stream_get_contents($pipes[2]);}finally{fclose($pipes[1]);fclose($pipes[2]);proc_close($process);}
$result=json_decode($stdout,true);if(empty($result['success'])||!filesize($out)){error_log('OneClick AI: '.$stderr);throw new Exception('model');}
echo json_encode(['success'=>true,'image'=>'data:image/png;base64,'.base64_encode(file_get_contents($out)),'method'=>$action==='upscale'?'Real-ESRGAN 4x':'U²-Net','width'=>$result['width'],'height'=>$result['height']]);
}catch(Throwable $e){http_response_code(503);echo json_encode(['error'=>$e->getMessage()]);}finally{@unlink($in);@unlink($out);flock($lock,LOCK_UN);fclose($lock);}
