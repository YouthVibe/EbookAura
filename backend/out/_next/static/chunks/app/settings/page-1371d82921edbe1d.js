(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[662],{2882:(e,t,s)=>{Promise.resolve().then(s.bind(s,4472))},4472:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>_});var n=s(5155),a=s(2115),i=s(5695),o=s(6874),l=s.n(o),r=s(9911),c=s(6068),d=s(8432),m=s.n(d),h=s(7203);function _(){let{user:e,logout:t,getToken:s}=(0,c.h)(),o=(0,i.useRouter)(),[d,_]=(0,a.useState)(!0),[g,u]=(0,a.useState)(""),[k,j]=(0,a.useState)(""),[x,N]=(0,a.useState)(""),[v,w]=(0,a.useState)([]),[b,f]=(0,a.useState)([]),[y,p]=(0,a.useState)("light"),[I,A]=(0,a.useState)(!1),[B,T]=(0,a.useState)(!1),[E,C]=(0,a.useState)(!1);(0,a.useEffect)(()=>{if(!e)return void o.push("/login");D();let t=localStorage.getItem("theme")||"light";p(t),document.documentElement.setAttribute("data-theme",t)},[e,o]);let D=async()=>{_(!0),u("");try{let e=s();if(!e)throw Error("No authentication token found");let t=await fetch("".concat(h.JR,"/reviews/user"),{method:"GET",headers:{Authorization:"Bearer ".concat(e),"Content-Type":"application/json"}});if(!t.ok)throw Error("Failed to fetch reviews");let n=await t.json();w(n);let a=await fetch("".concat(h.JR,"/bookmarks"),{method:"GET",headers:{Authorization:"Bearer ".concat(e),"Content-Type":"application/json"}});if(!a.ok)throw Error("Failed to fetch bookmarks");let i=await a.json();f(i)}catch(e){console.error("Error fetching user data:",e),u(e.message||"An error occurred while fetching your data")}finally{_(!1)}},S=async e=>{N("Are you sure you want to delete this review?"),j(""),u("");try{let t=s();if(!t)throw Error("No authentication token found");let n=await fetch("".concat(h.JR,"/reviews/").concat(e),{method:"DELETE",headers:{Authorization:"Bearer ".concat(t),"Content-Type":"application/json"}});if(!n.ok){let e=await n.json();throw Error(e.message||"Failed to delete review")}j("Review deleted successfully"),w(v.filter(t=>t._id!==e))}catch(e){console.error("Error deleting review:",e),u(e.message||"An error occurred while deleting the review")}},R=async()=>{T(!0)},L=async()=>{T(!1),_(!0),u(""),j("");try{let e=s();if(!e)throw Error("No authentication token found");let t=await fetch("".concat(h.JR,"/reviews/user/all"),{method:"DELETE",headers:{Authorization:"Bearer ".concat(e),"Content-Type":"application/json"}});if(!t.ok){let e=await t.json();throw Error(e.message||"Failed to delete all reviews")}j("All reviews deleted successfully"),w([])}catch(e){console.error("Error deleting all reviews:",e),u(e.message||"An error occurred while deleting all reviews")}finally{_(!1)}},F=async e=>{N("Are you sure you want to delete this bookmark?"),j(""),u("");try{let t=s();if(!t)throw Error("No authentication token found");let n=await fetch("".concat(h.JR,"/bookmarks/").concat(e),{method:"DELETE",headers:{Authorization:"Bearer ".concat(t),"Content-Type":"application/json"}});if(!n.ok){let e=await n.json();throw Error(e.message||"Failed to delete bookmark")}j("Bookmark deleted successfully"),f(b.filter(t=>t._id!==e))}catch(e){console.error("Error deleting bookmark:",e),u(e.message||"An error occurred while deleting the bookmark")}},H=async()=>{C(!0)},M=async()=>{C(!1),_(!0),u(""),j("");try{let e=s();if(!e)throw Error("No authentication token found");let t=await fetch("".concat(h.JR,"/bookmarks/all"),{method:"DELETE",headers:{Authorization:"Bearer ".concat(e),"Content-Type":"application/json"}});if(!t.ok){let e=await t.json();throw Error(e.message||"Failed to delete all bookmarks")}j("All bookmarks deleted successfully"),f([])}catch(e){console.error("Error deleting all bookmarks:",e),u(e.message||"An error occurred while deleting all bookmarks")}finally{_(!1)}},J=async()=>{A(!1),_(!0),u(""),j("");try{let e=s();if(!e)throw Error("No authentication token found");let n=await fetch("".concat(h.JR,"/users/profile"),{method:"DELETE",headers:{Authorization:"Bearer ".concat(e),"Content-Type":"application/json"}});if(!n.ok){let e=await n.json();throw Error(e.message||"Failed to delete account")}j("Account deleted successfully"),t(),o.push("/")}catch(e){console.error("Error deleting account:",e),u(e.message||"An error occurred while deleting your account"),_(!1)}};return d?(0,n.jsx)("div",{className:m().container,children:(0,n.jsx)("div",{className:m().settingsContainer,children:(0,n.jsx)("div",{className:m().loading,children:(0,n.jsx)("div",{className:m().loadingAnimation})})})}):(0,n.jsxs)("div",{className:m().container,children:[(0,n.jsxs)("div",{className:m().settingsContainer,children:[(0,n.jsxs)("div",{className:m().header,children:[(0,n.jsxs)(l(),{href:"/profile",className:m().backLink,children:[(0,n.jsx)(r.QVr,{className:m().backIcon}),"Back to Profile"]}),(0,n.jsx)("h1",{className:m().headerTitle,children:"Settings"}),(0,n.jsx)("p",{className:m().headerSubtitle,children:"Manage your account settings"})]}),g&&(0,n.jsx)("div",{className:m().errorMessage,children:g}),k&&(0,n.jsx)("div",{className:m().successMessage,children:k}),(0,n.jsxs)("div",{className:m().settingsSection,children:[(0,n.jsx)("h2",{className:m().sectionTitle,children:"Account Settings"}),(0,n.jsxs)("div",{className:m().settingItem,children:[(0,n.jsxs)("div",{className:m().settingInfo,children:[(0,n.jsx)("h3",{className:m().settingTitle,children:"Delete Account"}),(0,n.jsx)("p",{className:m().settingDescription,children:"Permanently delete your account and all associated data"})]}),(0,n.jsxs)("button",{className:m().deleteButton,onClick:()=>{A(!0)},children:[(0,n.jsx)(r.qbC,{className:m().deleteIcon}),"Delete Account"]})]})]}),(0,n.jsxs)("div",{className:m().settingsSection,children:[(0,n.jsx)("h2",{className:m().sectionTitle,children:"Reviews & Ratings"}),(0,n.jsxs)("div",{className:m().settingItem,children:[(0,n.jsxs)("div",{className:m().settingInfo,children:[(0,n.jsx)("h3",{className:m().settingTitle,children:"Delete All Reviews"}),(0,n.jsx)("p",{className:m().settingDescription,children:"Remove all your reviews and ratings from books"})]}),(0,n.jsxs)("button",{className:m().deleteButton,onClick:R,children:[(0,n.jsx)(r.qbC,{className:m().deleteIcon}),"Delete All Reviews"]})]}),v.length>0&&(0,n.jsxs)("div",{className:m().reviewsList,children:[(0,n.jsx)("h3",{className:m().subsectionTitle,children:"Your Reviews"}),v.map(e=>(0,n.jsxs)("div",{className:m().reviewItem,children:[(0,n.jsxs)("div",{className:m().reviewInfo,children:[(0,n.jsx)("h4",{className:m().bookTitle,children:e.book.title}),(0,n.jsx)("div",{className:m().rating,children:[void 0,void 0,void 0,void 0,void 0].map((t,s)=>(0,n.jsx)(r.gt3,{className:"".concat(m().starIcon," ").concat(s<e.rating?m().filled:"")},s))}),(0,n.jsx)("p",{className:m().reviewText,children:e.text}),(0,n.jsx)("p",{className:m().reviewDate,children:new Date(e.createdAt).toLocaleDateString()})]}),(0,n.jsx)("button",{className:m().deleteReviewButton,onClick:()=>S(e._id),children:(0,n.jsx)(r.qbC,{className:m().deleteIcon})})]},e._id))]})]}),(0,n.jsxs)("div",{className:m().settingsSection,children:[(0,n.jsx)("h2",{className:m().sectionTitle,children:"Bookmarks"}),(0,n.jsxs)("div",{className:m().settingItem,children:[(0,n.jsxs)("div",{className:m().settingInfo,children:[(0,n.jsx)("h3",{className:m().settingTitle,children:"Delete All Bookmarks"}),(0,n.jsx)("p",{className:m().settingDescription,children:"Remove all your bookmarked books"})]}),(0,n.jsxs)("button",{className:m().deleteButton,onClick:H,children:[(0,n.jsx)(r.qbC,{className:m().deleteIcon}),"Delete All Bookmarks"]})]}),b.length>0&&(0,n.jsxs)("div",{className:m().bookmarksList,children:[(0,n.jsx)("h3",{className:m().subsectionTitle,children:"Your Bookmarks"}),b.map(e=>(0,n.jsxs)("div",{className:m().bookmarkItem,children:[(0,n.jsxs)("div",{className:m().bookmarkInfo,children:[(0,n.jsx)("h4",{className:m().bookTitle,children:e.book.title}),(0,n.jsxs)("p",{className:m().bookmarkDate,children:["Added on ",new Date(e.createdAt).toLocaleDateString()]})]}),(0,n.jsx)("button",{className:m().deleteBookmarkButton,onClick:()=>F(e._id),children:(0,n.jsx)(r.qbC,{className:m().deleteIcon})})]},e._id))]})]}),(0,n.jsxs)("div",{className:m().settingsSection,children:[(0,n.jsx)("h2",{className:m().sectionTitle,children:"Appearance"}),(0,n.jsxs)("div",{className:m().settingItem,children:[(0,n.jsxs)("div",{className:m().settingInfo,children:[(0,n.jsx)("h3",{className:m().settingTitle,children:"Theme"}),(0,n.jsx)("p",{className:m().settingDescription,children:"Switch between light and dark mode"})]}),(0,n.jsx)("button",{className:m().themeButton,onClick:()=>{let e="light"===y?"dark":"light";p(e),localStorage.setItem("theme",e),document.documentElement.setAttribute("data-theme",e)},children:"light"===y?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.V6H,{className:m().themeIcon}),"Dark Mode"]}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.wQq,{className:m().themeIcon}),"Light Mode"]})})]})]})]}),I&&(0,n.jsx)("div",{className:m().modalOverlay,children:(0,n.jsxs)("div",{className:m().modal,children:[(0,n.jsxs)("div",{className:m().modalHeader,children:[(0,n.jsx)(r.BS8,{className:m().warningIcon}),(0,n.jsx)("h3",{className:m().modalTitle,children:"Delete Account"})]}),(0,n.jsxs)("div",{className:m().modalContent,children:[(0,n.jsx)("p",{children:"Are you sure you want to delete your account? This action cannot be undone."}),(0,n.jsx)("p",{children:"All your data, including reviews, bookmarks, and profile information will be permanently deleted."})]}),(0,n.jsxs)("div",{className:m().modalActions,children:[(0,n.jsx)("button",{className:m().cancelButton,onClick:()=>A(!1),children:"Cancel"}),(0,n.jsx)("button",{className:m().confirmDeleteButton,onClick:J,children:"Delete Account"})]})]})}),B&&(0,n.jsx)("div",{className:m().modalOverlay,children:(0,n.jsxs)("div",{className:m().modal,children:[(0,n.jsxs)("div",{className:m().modalHeader,children:[(0,n.jsx)(r.BS8,{className:m().warningIcon}),(0,n.jsx)("h3",{className:m().modalTitle,children:"Delete All Reviews"})]}),(0,n.jsxs)("div",{className:m().modalContent,children:[(0,n.jsx)("p",{children:"Are you sure you want to delete all your reviews? This action cannot be undone."}),(0,n.jsx)("p",{children:"All your reviews and ratings will be permanently removed from the platform."})]}),(0,n.jsxs)("div",{className:m().modalActions,children:[(0,n.jsx)("button",{className:m().cancelButton,onClick:()=>T(!1),children:"Cancel"}),(0,n.jsx)("button",{className:m().confirmDeleteButton,onClick:L,children:"Delete All Reviews"})]})]})}),E&&(0,n.jsx)("div",{className:m().modalOverlay,children:(0,n.jsxs)("div",{className:m().modal,children:[(0,n.jsxs)("div",{className:m().modalHeader,children:[(0,n.jsx)(r.BS8,{className:m().warningIcon}),(0,n.jsx)("h3",{className:m().modalTitle,children:"Delete All Bookmarks"})]}),(0,n.jsxs)("div",{className:m().modalContent,children:[(0,n.jsx)("p",{children:"Are you sure you want to delete all your bookmarks? This action cannot be undone."}),(0,n.jsx)("p",{children:"All your bookmarked books will be permanently removed from your account."})]}),(0,n.jsxs)("div",{className:m().modalActions,children:[(0,n.jsx)("button",{className:m().cancelButton,onClick:()=>C(!1),children:"Cancel"}),(0,n.jsx)("button",{className:m().confirmDeleteButton,onClick:M,children:"Delete All Bookmarks"})]})]})})]})}},8432:e=>{e.exports={container:"settings_container__2ie5P",settingsContainer:"settings_settingsContainer__OiAFk",settingsHeader:"settings_settingsHeader__pxI5K",settingsSection:"settings_settingsSection__i2OtM",settingsForm:"settings_settingsForm__QFBN5",formGroup:"settings_formGroup___ZcmN",button:"settings_button__4aUGd",primaryButton:"settings_primaryButton__r0y9U",secondaryButton:"settings_secondaryButton__YzKrA",dangerButton:"settings_dangerButton__XNJJQ",message:"settings_message__U_WnO",successMessage:"settings_successMessage__nvFhf",errorMessage:"settings_errorMessage__YJSxc",warningMessage:"settings_warningMessage__jmRQI",backLink:"settings_backLink__3JJTg",backIcon:"settings_backIcon__E6WHq",headerTitle:"settings_headerTitle__pykIb",headerSubtitle:"settings_headerSubtitle__GyGtZ",sectionTitle:"settings_sectionTitle__yFwCw",settingItem:"settings_settingItem__qqkai",settingInfo:"settings_settingInfo__jxpWV",settingTitle:"settings_settingTitle__IOOWP",settingDescription:"settings_settingDescription__1xJyu",deleteButton:"settings_deleteButton__9fZZ7",themeButton:"settings_themeButton__F_erJ",deleteIcon:"settings_deleteIcon__tGVGU",themeIcon:"settings_themeIcon__Mswhh",reviewsList:"settings_reviewsList___u4RK",bookmarksList:"settings_bookmarksList__nlMIQ",subsectionTitle:"settings_subsectionTitle__D_Xig",reviewItem:"settings_reviewItem__52dUc",bookmarkItem:"settings_bookmarkItem__mEyHR",reviewInfo:"settings_reviewInfo__krb9U",bookmarkInfo:"settings_bookmarkInfo__8ew8H",bookTitle:"settings_bookTitle__rMtHL",rating:"settings_rating__kjcCJ",starIcon:"settings_starIcon__2r7HL",filled:"settings_filled__LaxsW",reviewText:"settings_reviewText__KTEim",reviewDate:"settings_reviewDate__OpLag",bookmarkDate:"settings_bookmarkDate__tU6uH",deleteReviewButton:"settings_deleteReviewButton__EyRh2",deleteBookmarkButton:"settings_deleteBookmarkButton__2IdN6",loading:"settings_loading__xABMV",loadingAnimation:"settings_loadingAnimation__3ISGg",spin:"settings_spin__w0HRh",modalOverlay:"settings_modalOverlay__SuNGX",modal:"settings_modal__YzoDu",modalHeader:"settings_modalHeader__LErpR",warningIcon:"settings_warningIcon__F6lGo",modalTitle:"settings_modalTitle__slN_P",modalContent:"settings_modalContent__yG9LW",modalActions:"settings_modalActions__wzsXm",cancelButton:"settings_cancelButton__4TiaH",confirmDeleteButton:"settings_confirmDeleteButton__0gYCm"}}},e=>{var t=t=>e(e.s=t);e.O(0,[619,711,874,469,441,684,358],()=>t(2882)),_N_E=e.O()}]);