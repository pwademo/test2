/*  */

const nav=document.querySelector(".navbar");
fetch("/testPWA/navbar.html")
.then(
    res=>res.text()
)
.then(    
    data=>{        
       // console.log(data);
        nav.innerHTML=data;
    }
);
