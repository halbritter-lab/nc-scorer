"use strict";(self["webpackChunknc_scorer"]=self["webpackChunknc_scorer"]||[]).push([[983],{9983:function(e,a,n){n.r(a),n.d(a,{default:function(){return v}});var r=n(3396);function o(e,a,n,o,c,s){const t=(0,r.up)("search-component"),l=(0,r.up)("v-container");return(0,r.wg)(),(0,r.j4)(l,null,{default:(0,r.w5)((()=>[(0,r.Wm)(t)])),_:1})}var c=n(9242);function s(e,a,n,o,s,t){const l=(0,r.up)("v-autocomplete"),u=(0,r.up)("v-btn"),i=(0,r.up)("v-card-text"),d=(0,r.up)("v-card");return(0,r.wg)(),(0,r.j4)(d,{class:"search-card"},{default:(0,r.w5)((()=>[(0,r.Wm)(i,null,{default:(0,r.w5)((()=>[(0,r.Wm)(l,{modelValue:o.searchQuery,"onUpdate:modelValue":a[0]||(a[0]=e=>o.searchQuery=e),items:o.symbols,label:"Search genes",loading:o.isLoading,onKeyup:(0,c.D2)(o.search,["enter"])},null,8,["modelValue","items","loading","onKeyup"]),(0,r.Wm)(u,{color:"primary",onClick:o.search,class:"mx-auto d-block"},{default:(0,r.w5)((()=>[(0,r.Uk)(" Search ")])),_:1},8,["onClick"])])),_:1})])),_:1})}n(560);var t=n(4870),l=n(2483),u={setup(){const e=(0,t.iH)(""),a=(0,l.tv)(),n=(0,t.iH)([]),o=(0,t.iH)(!1),c=(0,t.iH)(null),s=async()=>{o.value=!0;try{const e=await fetch("json/symbols_index.json");if(!e.ok)throw new Error("Failed to fetch symbols");n.value=await e.json()}catch(e){c.value=e}finally{o.value=!1}};function u(){e.value&&a.push({path:`/symbols/${e.value}`})}return(0,r.bv)(s),{searchQuery:e,search:u,symbols:n,isLoading:o,error:c}}},i=n(89);const d=(0,i.Z)(u,[["render",s],["__scopeId","data-v-27e61c32"]]);var p=d,h={components:{SearchComponent:p}};const m=(0,i.Z)(h,[["render",o]]);var v=m}}]);
//# sourceMappingURL=983.5e20b292.js.map