/*  */

const nav=document.querySelector(".navbar");
fetch("/test2/navbar.html")
.then(
    res=>res.text()
)
.then(    
    data=>{        
       // console.log(data);
        nav.innerHTML=data;
    }
);
