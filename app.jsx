async function optimizePhoto(file){
 if(!file.type.startsWith('image/')||!window.createImageBitmap||file.size<350*1024)return file;
 const bitmap=await createImageBitmap(file),maxEdge=1600,scale=Math.min(1,maxEdge/bitmap.width,maxEdge/bitmap.height);
 if(scale===1&&file.type==='image/png'){bitmap.close();return file;}
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const context=canvas.getContext('2d');context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const type=file.type==='image/png'?'image/png':file.type==='image/webp'?'image/webp':'image/jpeg';
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('บีบอัดภาพไม่สำเร็จ')),type,type==='image/png'?undefined:0.82));
 if(blob.size>=file.size)return file;
 const ext=type==='image/png'?'.png':type==='image/webp'?'.webp':'.jpg';
 return new File([blob],file.name.replace(/\.[^.]+$/,ext),{type,lastModified:file.lastModified});
}
