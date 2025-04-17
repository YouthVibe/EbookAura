(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[839],{1638:e=>{e.exports={container:"verify-email_container__zVpAv",verifyBox:"verify-email_verifyBox__F7G_7",fadeIn:"verify-email_fadeIn__rE06L",header:"verify-email_header__JBB_3",title:"verify-email_title__BGXl6",titleEbook:"verify-email_titleEbook__jDHI5",titleAura:"verify-email_titleAura__dNFbX",subtitle:"verify-email_subtitle__I66wK",form:"verify-email_form__erwCx",formGroup:"verify-email_formGroup__aosRf",label:"verify-email_label__FOAz_",input:"verify-email_input__8LKNb",submitButton:"verify-email_submitButton___p4m8",resendCode:"verify-email_resendCode__c86iw",resendButton:"verify-email_resendButton__hfUZg",backToLogin:"verify-email_backToLogin__y1l1H",errorMessage:"verify-email_errorMessage__pBcgX",shake:"verify-email_shake__wCtOA",successMessage:"verify-email_successMessage__ONWxL",loading:"verify-email_loading__g6Op4",pulse:"verify-email_pulse__r9uf0"}},2047:(e,t,a)=>{"use strict";async function r(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};try{let a="".concat("https://ebookaura.onrender.com/api").concat(e);console.log("API Request: ".concat(t.method||"GET"," ").concat(a)),t.headers||(t.headers={}),!t.body||t.headers["Content-Type"]||t.body instanceof FormData||(t.headers["Content-Type"]="application/json");{let e=localStorage.getItem("token"),a=localStorage.getItem("apiKey");e&&a&&(t.headers.Authorization="Bearer ".concat(e),t.headers["X-API-Key"]=a)}let r=await fetch(a,t),s=r.headers.get("content-type");if(!r.ok){if(console.error("API Error (".concat(r.status,"): ").concat(r.statusText)),s&&s.includes("application/json")){let e=await r.json();throw Error(e.message||"API request failed with status ".concat(r.status))}{let e=await r.text();console.error("Non-JSON error response:",e.substring(0,150)+"...");let t="API request failed with status ".concat(r.status);if(e.includes("<title>")&&e.includes("</title>")){let a=e.match(/<title>(.*?)<\/title>/i);a&&a[1]&&(t="Server Error: ".concat(a[1]))}throw Error(t)}}if(s&&s.includes("application/json"))return await r.json();{console.warn("Response is not JSON. Content-Type:",s);let e=await r.text();try{return JSON.parse(e)}catch(e){throw console.error("Failed to parse response as JSON:",e),Error("API response was not valid JSON")}}}catch(e){throw console.error("API request error:",e),e}}async function s(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return r(e,{method:"GET",...t})}async function i(e,t){let a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return r(e,{method:"POST",body:t instanceof FormData?t:JSON.stringify(t),...a})}async function o(e,t){let a=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return r(e,{method:"PUT",body:JSON.stringify(t),...a})}async function l(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return r(e,{method:"DELETE",...t})}a.d(t,{Xj:()=>i,_5:()=>l,dw:()=>s,q1:()=>o})},2235:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>f});var r=a(5155),s=a(2115),i=a(5695),o=a(6874),l=a.n(o),n=a(1638),c=a.n(n),d=a(6068),u=a(2047);function m(){let e=(0,i.useRouter)(),t=(0,i.useSearchParams)(),[a,o]=(0,s.useState)(""),[n,m]=(0,s.useState)(""),[h,f]=(0,s.useState)(!1),[v,g]=(0,s.useState)(""),[y,p]=(0,s.useState)(!1),{login:_}=(0,d.h)();(0,s.useEffect)(()=>{let e=t.get("email");e&&o(e)},[t]);let x=async t=>{if(t.preventDefault(),g(""),!a)return void g("Email is required");if(!n||6!==n.length)return void g("Please enter a valid 6-digit verification code");f(!0);try{let t=await (0,u.Xj)("/users/verify-email",{email:a,code:n});p(!0),_(t),setTimeout(()=>{e.push("/")},2e3)}catch(e){g(e.message)}finally{f(!1)}},j=async()=>{if(!a)return void g("Email is required");f(!0),g("");try{await (0,u.Xj)("/users/resend-verification",{email:a}),g(""),alert("A new verification code has been sent to your email")}catch(e){g(e.message)}finally{f(!1)}};return y?(0,r.jsx)("div",{className:c().container,children:(0,r.jsxs)("div",{className:c().verifyBox,children:[(0,r.jsxs)("div",{className:c().header,children:[(0,r.jsxs)("h1",{className:c().title,children:[(0,r.jsx)("span",{className:c().titleEbook,children:"Ebook"}),(0,r.jsx)("span",{className:c().titleAura,children:"Aura"})]}),(0,r.jsx)("p",{className:c().subtitle,children:"Email Verification Successful!"})]}),(0,r.jsxs)("div",{className:c().successMessage,children:[(0,r.jsx)("p",{children:"Your email has been verified successfully."}),(0,r.jsx)("p",{children:"You will be redirected to the homepage in a moment..."})]})]})}):(0,r.jsx)("div",{className:c().container,children:(0,r.jsxs)("div",{className:c().verifyBox,children:[(0,r.jsxs)("div",{className:c().header,children:[(0,r.jsxs)("h1",{className:c().title,children:[(0,r.jsx)("span",{className:c().titleEbook,children:"Ebook"}),(0,r.jsx)("span",{className:c().titleAura,children:"Aura"})]}),(0,r.jsx)("p",{className:c().subtitle,children:"Verify Your Email"})]}),v&&(0,r.jsx)("div",{className:c().errorMessage,children:v}),(0,r.jsxs)("form",{onSubmit:x,className:c().form,children:[(0,r.jsxs)("div",{className:c().formGroup,children:[(0,r.jsx)("label",{htmlFor:"email",className:c().label,children:"Email Address"}),(0,r.jsx)("input",{type:"email",id:"email",className:c().input,placeholder:"Enter your email",value:a,onChange:e=>o(e.target.value),required:!0,disabled:!!t.get("email")})]}),(0,r.jsxs)("div",{className:c().formGroup,children:[(0,r.jsx)("label",{htmlFor:"code",className:c().label,children:"Verification Code"}),(0,r.jsx)("input",{type:"text",id:"code",className:c().input,placeholder:"Enter 6-digit code",value:n,onChange:e=>m(e.target.value.replace(/[^0-9]/g,"").slice(0,6)),required:!0,pattern:"[0-9]{6}",maxLength:"6"})]}),(0,r.jsx)("button",{type:"submit",className:c().submitButton,disabled:h,children:h?"Verifying...":"Verify Email"})]}),(0,r.jsx)("div",{className:c().resendCode,children:(0,r.jsxs)("p",{children:["Didn't receive the code? ",(0,r.jsx)("button",{type:"button",className:c().resendButton,onClick:j,disabled:h,children:"Resend Code"})]})}),(0,r.jsx)("div",{className:c().backToLogin,children:(0,r.jsx)(l(),{href:"/login",children:"Back to Login"})})]})})}function h(){return(0,r.jsx)("div",{className:c().container,children:(0,r.jsxs)("div",{className:c().verifyBox,children:[(0,r.jsxs)("div",{className:c().header,children:[(0,r.jsxs)("h1",{className:c().title,children:[(0,r.jsx)("span",{className:c().titleEbook,children:"Ebook"}),(0,r.jsx)("span",{className:c().titleAura,children:"Aura"})]}),(0,r.jsx)("p",{className:c().subtitle,children:"Verify Your Email"})]}),(0,r.jsx)("div",{className:c().loading,children:"Loading verification form..."})]})})}function f(){return(0,r.jsx)(s.Suspense,{fallback:(0,r.jsx)(h,{}),children:(0,r.jsx)(m,{})})}},5695:(e,t,a)=>{"use strict";var r=a(8999);a.o(r,"useParams")&&a.d(t,{useParams:function(){return r.useParams}}),a.o(r,"useRouter")&&a.d(t,{useRouter:function(){return r.useRouter}}),a.o(r,"useSearchParams")&&a.d(t,{useSearchParams:function(){return r.useSearchParams}})},6068:(e,t,a)=>{"use strict";a.d(t,{AuthProvider:()=>c,h:()=>d});var r=a(5155),s=a(2115),i=a(5695),o=a(2047);let l=(0,s.createContext)(),n=()=>"ak_"+Array.from(crypto.getRandomValues(new Uint8Array(24))).map(e=>e.toString(16).padStart(2,"0")).join(""),c=e=>{let{children:t}=e,[a,c]=(0,s.useState)(null),[d,u]=(0,s.useState)(!0),[m,h]=(0,s.useState)(!1),f=(0,i.useRouter)();(0,s.useEffect)(()=>{h(!0);let e=localStorage.getItem("userInfo"),t=localStorage.getItem("token");if(localStorage.getItem("apiKey"),e&&t)try{c(JSON.parse(e)),(async()=>{try{await (0,o.dw)("/auth/check",{headers:{Authorization:"Bearer ".concat(t)}})}catch(e){console.error("Token validation failed:",e),g()}})()}catch(e){console.error("Failed to parse user info:",e),localStorage.removeItem("userInfo"),localStorage.removeItem("token"),localStorage.removeItem("apiKey")}u(!1)},[]);let v=e=>{if(console.log("Processing login data"),!e)return void console.error("No user data received for login");try{if(!e.token)return void console.error("No token in login data");let{token:t,...a}=e;console.log("Setting user data:",a),c(a);{localStorage.setItem("userInfo",JSON.stringify(a)),localStorage.setItem("token",t);let e=localStorage.getItem("apiKey");e||(console.log("Generating new API key"),e=n(),localStorage.setItem("apiKey",e)),console.log("Authentication data stored in localStorage")}}catch(e){console.error("Error processing login:",e)}},g=()=>{c(null),localStorage.removeItem("userInfo"),localStorage.removeItem("token"),f.push("/login")},y=()=>localStorage.getItem("token"),p=()=>localStorage.getItem("apiKey");return m?(0,r.jsx)(l.Provider,{value:{user:a,loading:d,login:v,logout:g,getToken:y,getApiKey:p},children:t}):(0,r.jsx)(l.Provider,{value:{user:null,loading:!0,login:v,logout:g,getToken:y,getApiKey:p},children:t})},d=()=>{let e=(0,s.useContext)(l);if(void 0===e)throw Error("useAuth must be used within an AuthProvider");return e}},7133:(e,t,a)=>{Promise.resolve().then(a.bind(a,2235))}},e=>{var t=t=>e(e.s=t);e.O(0,[945,874,441,684,358],()=>t(7133)),_N_E=e.O()}]);