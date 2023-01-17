if ('serviceWorker' in navigator) {
    //navigator.serviceWorker.register('/sw.js');
    //updateViaCache none, meaning the HTTP cache is never consulted.
    navigator.serviceWorker    
    .register("./sw.js", {updateViaCache: "none", })
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        // If updatefound is fired, it means that there's a new service worker being installed.
        //console.log(`Value of updateViaCache: ${registration.updateViaCache}`);
      });
    })
    .catch((error) => {
      console.error(`Service worker registration failed: ${error}`);
    });

    //Lyt efter svar message fra SW
    navigator.serviceWorker.addEventListener('message', event => {
        let data=event.data;
        //console.log("Message fra SW",data);
        /* *************** */
        if("cacheVersion" in data){
            document.getElementById("cacheVersion").innerHTML = `Version: ${data.cacheVersion}`;
        }
        /* *************** */
        if("fileNamesInCache" in data){
            console.log("Filer med verionsnummer i cache")
            console.table(data.fileNamesInCache);
            /*   */        
            document.getElementById("fileNamesInCache").innerHTML="";
            
            data.fileNamesInCache.forEach((item, index)=>{
                //console.log(item,index);
                document.getElementById("fileNamesInCache").innerHTML+=`${item[0]} ${item[1]}</br>`;
            });             

            //document.getElementById("fileNamesInCache").innerHTML = `Filenames in cache: ${data.fileNamesInCache}`;
        }
        /* *************** */
        if("isOnline" in data){
            console.log("######################################################");
            console.log(data.isOnline);
            document.getElementById("isOnline").innerHTML = `Is Online confirmed by fetch call to server: ${data.isOnline}`;
        }
    });
    function myFunction(item, index) {
        text += index + ": " + item + "<br>"; 
      }

    const installedMode=document.getElementById("installedMode");
    if(navigator.standalone){
        //console.log("Installed on IOS");
        installedMode.innerHTML="Installed on IOS"
    } else if(matchMedia('(display-mode:standalone)').matches){
        //console.log("Installed on android or desktop");
        installedMode.innerHTML="Installed on android or desktop"
    } else {
        //console.log("Launched from a browser tab");
        installedMode.innerHTML="Launched from a browser tab"
    }


    //Send forspørgelse til SW
    navigator.serviceWorker.ready.then( registration => {
        registration.active.postMessage({
            "getVersion":true
/*             ,
            "getFileNamesInCache":true */
        });       
    });

}






const mytablebody = document.querySelector(".tablebody");
const mytablehead = document.querySelector(".tablehead");
const storeName="myStore";
const dbName="myDb";
const dbVersion=1;



const mySchema=[
    {
        name: "firstname",
        displayname:"First Name",
        value:"",
        type: "text",
        placeholder:"First name",
        width:"100px"
    },
    {
        name: "lastname",
        displayname:"Last Name",
        value:"",
        type: "text",
        placeholder:"Last name",
        width:"140px"
    },
    {
        name: "address",
        displayname:"Address",
        value:"",
        type: "text",
        placeholder:"address",
        width:"300px"
    },
    {
        name: "age",
        displayname:"Age",
        value:"25",
        type: "number",
        placeholder:"Age",
        width:"60px"
    },
    {
        name: "color",
        displayname:"Color",
        value:"#ff00ff",
        type: "color",
        placeholder:"Select color",
        width:"30px"
    },
    {
        name: "date",
        displayname:"Date",
        value:"",
        type: "date",
        placeholder:"Select date",
        width:"120px"
    },
    {
        name: "month",
        displayname:"Month",
        value:"",
        type: "month",
        placeholder:"Select month",
        width:"120px"
    },
    {
        name: "picture",
        displayname:"Picture",
        value:"",
        type: "file",
        placeholder:"Select file",
        width:"520px"
    }
]

const IDBRequest = indexedDB.open(dbName, dbVersion);
IDBRequest.addEventListener("upgradeneeded", ()=>{
    const db = IDBRequest.result;
    db.createObjectStore(storeName, {
        autoIncrement: true
    });
});

IDBRequest.addEventListener("success", ()=>{
    readObject();
});

IDBRequest.addEventListener("error", (err)=>{
    console.error("Error:", err);
});

/* let isBlured=false; */
/* window.addEventListener("beforeunload", function(event) {

    console.log("IsBlurred",isBlured);
    console.log(event);
    event.returnValue = "Write something clever here..";
  }); */

document.getElementById("btn_add").addEventListener("click", ()=>{      
    let newObj={};
    let obj=mySchema.map((item)=>{
           newObj[item.name]=item.value;
    } );
    addObject(newObj);
    readObject();
});

const addObject = (object)=>{
    const IDBData = getIDBData("readwrite");
    IDBData.store.add(object);
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object added");
    });
};

const readObject = ()=>{
    const IDBData = getIDBData("readonly");
    IDBData.store.openCursor();
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object added");
    });

    const cursor = IDBData.store.openCursor(null, 'prev');
    const fragment = document.createDocumentFragment();

    mytablehead.innerHTML = "";
    let headrow=createElementTableHead();
    mytablehead.appendChild(headrow);

    mytablebody.innerHTML = "";

    cursor.addEventListener("success", ()=>{
        if(cursor.result){
            let element = createElementUI(cursor.result.key, cursor.result.value);
            fragment.appendChild(element);
            cursor.result.continue();
        } else{
            //when there is no more data to add to the fragment
            mytablebody.appendChild(fragment);
        };
    });
};

const editObject = (key, fieldData)=>{
    const IDBData = getIDBData("readwrite");
    
    const requestOldRecord= IDBData.store.get(key);
    requestOldRecord.onsuccess = (event) => {
        const OldRecord = requestOldRecord.result;
        const NewRecord=Object.assign(OldRecord,fieldData);//update record with the new field value

        //update with new data
        IDBData.store.put(NewRecord, key);
        IDBData.transaction.addEventListener("complete", ()=>{
            console.log("Record modified");
          
        });

    };  
};

const deleteObject = (key)=>{
    console.log("Key",key);
    const IDBData = getIDBData("readwrite");
    IDBData.store.delete(key);
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object deleted");
    });
};


const getIDBData = (mode)=>{
    const db = IDBRequest.result;
    const IDBtransaction = db.transaction(storeName, mode);
    const objectStore = IDBtransaction.objectStore(storeName);
    let IDBData={};
    IDBData["store"]=objectStore;
    IDBData["transaction"]=IDBtransaction;
    //console.log(IDBData);
    return IDBData;
};


const createElementTableHead = ()=>{
    const tr = document.createElement("TR");
    const th = document.createElement("TH");
    tr.appendChild(th);

    for (const [key, value] of Object.entries(mySchema)) {         
        const th = document.createElement("TH");       
        th.textContent =value.displayname;
        tr.appendChild(th);
    }  
    return tr;
}


const convertBase64 = (file) => {
    console.log(file);
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };
    });
};




const convertImgToResizedBase64 = (file) => {
    const max_size = 300;//max width or height

    return new Promise((resolve, reject) => {            
        let allowedExtension = ['image/jpeg', 'image/jpg', 'image/png','image/gif','image/bmp'];            
        if (allowedExtension.indexOf(file.type)===-1) {
            reject(`${file.type} is not a valid filetype`);
        }
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = (ev) => {
            const image = new Image();                    
                image.src = ev.target.result;
                image.onload = (imageEvent) =>
                {                        
                    let w = image.width;
                    let h = image.height;        
                    if (w > h) {  if (w > max_size) { h*=max_size/w; w=max_size; }
                    } else     {  if (h > max_size) { w*=max_size/h; h=max_size; } }
    
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(image, 0, 0, w, h);
                    const dataURL = canvas.toDataURL("image/jpeg", 1.0);
                    canvas.remove();
                    resolve(dataURL);
                }           
    };
    fileReader.onerror = (error) => {
        reject(error);
    };
});
};



const uploadImage = async (event) => {
    const file = event.target.files[0];
    const base64 = await convertBase64(file);
    console.log(base64);
    return base64;
/*     avatar.src = base64;
    textArea.innerText = base64; */
};


function imageToDataUri(img, width, height) {

    // create an off-screen canvas
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    // set its dimension to target size
    canvas.width = width;
    canvas.height = height;

    // draw source image into the off-screen canvas:
   // ctx.drawImageimg, 0, 0, width, height);

    // encode image to data-uri with base64 version of compressed image
    return canvas.toDataURL();
}

const createElementUI = (id, data)=>{
    //tr table row
    const tr = document.createElement("TR");

    //delete button    
    const td = document.createElement("TD");
    const deleteBtn = document.createElement("BUTTON");    
    deleteBtn.classList.add("btn_delete");
    deleteBtn.textContent = "X";
    deleteBtn.setAttribute("title","Delete");
    td.appendChild(deleteBtn);
    tr.appendChild(td);
    deleteBtn.addEventListener("click", ()=>{
        deleteObject(id);
        mytablebody.removeChild(tr);
    });

   //append fields from schema
   for (const [key, value] of Object.entries(mySchema)) {         
          //console.log(value.type);



          const td = document.createElement("TD");       
          const _input = document.createElement("INPUT"); 
          
          const valuefromdb=data[value.name]===undefined?"":data[value.name];
          _input.value= valuefromdb;
          _input.type=value.type;
          _input.placeholder=value.placeholder;
         // _input.setAttribute("spellcheck", "false");
          _input.style.width=value.width;
          td.appendChild(_input);
          tr.appendChild(td);

          if(value.type==="file" ){
            td.style.display="inline-flex";
            _input.style.display="none";//hide file input button
            const btn= document.createElement("BUTTON");
            btn.type="button";
            btn.classList.add("btn_img");
            btn.innerText="Upload img";
            btn.addEventListener("click",()=>{
                _input.click();
            });
            const img0 = document.createElement("IMG");    
            //img0.width=120;
            img0.src=valuefromdb;
            td.appendChild(btn);
            td.appendChild(img0); 
          } 



          _input.addEventListener("change",async (e)=>{              
              let obj = {};      
              if(e.target.type==="file")
              {

                //const base64=await uploadImage(e); 

                let file=e.target.files[0];
                const base64=await convertImgToResizedBase64(file);
                console.log(base64);
                
                


                obj[value.name] =base64;
                //remove img-tag from UI if img-tag alraedy exist
                const imgexisting=td.querySelector("IMG");
                if(imgexisting){imgexisting.remove();}

                const img = document.createElement("IMG");    
               // img.width=120;
                img.src=base64;
                td.appendChild(img); 
                
              } 
              else {
              obj[value.name] =_input.value;   
              } 

              editObject(id, obj)
          });

    }  

    return tr
};