
// Files to cache
const version="1.0.79";
const cacheName = `${version}_static`;
const cacheNames=[cacheName];
const appShellFiles = [
  '/testPWA/',
  '/testPWA/index.html',
  '/testPWA/app.js',
  '/testPWA/style.css',
  '/testPWA/styles.css',
  '/testPWA/manifest.json',
  '/testPWA/icons/icon-192x192.png',
  '/testPWA/icons/icon-512x512.png',
  '/testPWA/favicon.ico'
];





/* self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>{
        cache.addAll(appShellFiles)
      }        
      )
  );
}); */
/* */  
/* 
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>{
        appShellFiles.forEach(
              async file=>{
                const filewithparam= `${file}?x=${version}`;
                console.log(filewithparam);                
                const response = await fetch(filewithparam);//fetch med parm for at omgå http/browser cache


                cache.put(file, response); //put tilbage, men uden parm
              }                     
          )
      }        
      )
  );
}); */

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>{
        appShellFiles.forEach(
              async file=>{

                /* #region fetch with parameter to avoid http/browser cache */
                const filewithparam= `${file}?x=${version}`;             
                const response = await fetch(filewithparam);
                /* #endregion  */

                /* #region add header version-number in headers */
                const newHeaders = new Headers(response.headers);
                newHeaders.append('x-my-version', version);
                
                const responseExtra = new Response(response.body, {
                  status: response.status,
                  statusText: response.statusText,
                  headers: newHeaders
                });
                /* #endregion  */

                cache.put(file, responseExtra); //put to cache with original filename
              }                     
          )
      }        
      )
  );
}); 





self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (key) {
			return !cacheNames.includes(key);
		}).map(function (key) {
			return caches.delete(key);
		}));
	}).then(function () {
		return self.clients.claim();
	}));
});


async function getFilesInCacheWithVersion(){
    let obj={};
    appShellFiles.forEach(
      async file=>{ 
           const req =await caches.match(file).then((res)=>{    
              let version=res.headers.has('x-my-version')?res.headers.get('x-my-version'):"N/A";
              obj[file]=version;
            }
        );
      } 
    );
    return obj;
}





self.addEventListener('message', event => {
  let data=event.data;
  //console.log(`The client sent me a message: ${data}`);

  //#########################################################
  if("getVersion" in data){    
    event.source.postMessage({"cacheVersion": version});
  } 


  //#########################################################
  if("getFileNamesInCache" in data){
     
    let myPromise = new Promise(async function(myResolve, myReject) {
      let myArr=[];
      for (let index = 0; index < appShellFiles.length; index++) {
        const file = appShellFiles[index];
        caches.match(file)
          .then((res)=>
            {    
              /*  
                for (const pair of res.headers.entries()) {
                console.log(pair[0]+ ': '+ pair[1]);
                }
              console.log("==============XXXXXXXXXXXXXXXXXXX=================="); */
              let version=res.headers.has('x-my-version')?res.headers.get('x-my-version'):"N/A";
              myArr.push([file,version]);
              //console.log(appShellFiles.length);
              if(index== appShellFiles.length-1){
                  //console.table(myArr);
                  myResolve(myArr);   //Først når alle filer er lagt i myArr med versionsnummer sendes der videre til myPromise.then
              }   
            }    
          )
      } 
    });   

    myPromise.then(
      function(myArr) {
        event.source.postMessage({"fileNamesInCache": myArr});      
      }
    );      

  } 

  //#########################################################
  if("refreshCache" in data){
    event.waitUntil(
      caches      
        .open(cacheName)
        .then(async (cache) =>{
          const random=+ Math.floor(Math.random() * 1000);
          const response = await fetch(`index.html?x=${random}`);//bypass html cache med random parm
          //console.log(`index.html?x=${random}`);
          cache.put("index.html", response); //put tilbage uden parm          
        }
        )
    );
    event.source.postMessage({"cacheVersion": version});
  }

  //#########################################################

/**/   

 if("checkOnline" in data){
    let url="/test.png";//Må ikke lægges i cache
    //console.log(req);
    fetch(url)
      .then(
        response=>{
          //console.log("Vi ved med sikkerhed at vi er online da der kommer svar fra serveren");
          event.source.postMessage({"isOnline": true});
        },
        (error)=>{
          console.log("Vi ved med sikkerhed at vi er offline");
          event.source.postMessage({"isOnline": false});
        }    
      )
  } 

}); 

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
    e.respondWith((async () => {
        const req = await caches.match(e.request);
        if (req) return req; 

        //Nået hertil ved vi at filen ikke var i cache
        //Derfor hentes den fra server
        const response = await fetch(e.request);
        return response; 
    })());
  
});

