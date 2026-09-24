class ApiService {
  static get(action, params={}) {
    return new Promise((resolve) => {
      const callback = `sscb_${Date.now()}_${Math.floor(Math.random()*100000)}`;
      const script = document.createElement('script');
      const query = new URLSearchParams({action, callback});
      const token = App.getToken();
      if (token) query.set('token',token);
      Object.entries(params || {}).forEach(([k,v]) => {
        if (v !== undefined && v !== null) query.set(k,String(v));
      });

      let done=false;
      const finish=(data)=>{
        if(done) return; done=true;
        clearTimeout(timer); delete window[callback]; script.remove(); resolve(data);
      };
      window[callback]=finish;
      script.onerror=()=>finish({status:'error',message:'เชื่อมต่อ API ไม่สำเร็จ'});
      const timer=setTimeout(()=>finish({status:'error',message:'หมดเวลารอ API'}),CONFIG.JSONP_TIMEOUT);
      script.src=`${CONFIG.API_URL}?${query.toString()}`;
      document.head.appendChild(script);
    });
  }

  static post(action,payload={}) {
    return new Promise((resolve)=>{
      const name=`ss_iframe_${Date.now()}_${Math.floor(Math.random()*100000)}`;
      const iframe=document.createElement('iframe');
      iframe.name=name; iframe.className='hidden-frame'; iframe.setAttribute('aria-hidden','true');
      document.body.appendChild(iframe);

      const form=document.createElement('form');
      form.method='POST'; form.action=CONFIG.API_URL; form.target=name; form.className='hidden-frame';
      const fields=Object.assign({},payload,{action});
      if(action!=='adminLogin' && !fields.token) fields.token=App.getToken() || '';
      Object.entries(fields).forEach(([k,v])=>{
        const input=document.createElement('input'); input.type='hidden'; input.name=k;
        input.value=(v && typeof v==='object') ? JSON.stringify(v) : String(v ?? '');
        form.appendChild(input);
      });
      document.body.appendChild(form);

      let done=false;
      const cleanup=()=>{window.removeEventListener('message',onMessage); form.remove(); iframe.remove(); clearTimeout(timer);};
      const finish=(data)=>{if(done)return; done=true; cleanup(); resolve(data);};
      const onMessage=(event)=>{
        if(event.source!==iframe.contentWindow) return;
        const d=event.data;
        if(!d || d.source!=='SPORTS_SCIENCE_API') return;
        finish(d.data);
      };
      window.addEventListener('message',onMessage);
      const timer=setTimeout(()=>finish({status:'error',message:'หมดเวลารอผลการบันทึก'}),CONFIG.POST_TIMEOUT);
      try { form.submit(); } catch(e) { finish({status:'error',message:e.message}); }
    });
  }
}
