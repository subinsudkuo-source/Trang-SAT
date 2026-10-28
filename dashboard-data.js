/* Shared aggregation for the dashboard. Blank values are never treated as zero. */
(function (root) {
  const isSubmitted = row => row?.submitted === true || String(row?.submitted).toLowerCase() === 'true';
  const number = value => {
    if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return null;
    const result = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(result) && result >= 0 ? result : null;
  };
  const sum = values => {
    const known = values.map(number).filter(value => value !== null);
    return known.length ? known.reduce((total, value) => total + value, 0) : null;
  };
  const rows = (report, key) => Array.isArray(report?.floodReport?.[key]) ? report.floodReport[key] : [];
  const metrics = [
    {key:'affected',label:'ประชาชนได้รับผลกระทบ',unit:'คน',color:'#258dce'},
    {key:'households',label:'ครัวเรือนได้รับผลกระทบ',unit:'หลัง',color:'#7c3aed'},
    {key:'villages',label:'หมู่บ้านได้รับผลกระทบ',unit:'แห่ง',color:'#0891b2'},
    {key:'deaths',label:'ผู้เสียชีวิต',unit:'ราย',color:'#dc2626'},
    {key:'injuries',label:'ผู้บาดเจ็บ',unit:'ราย',color:'#ea580c'},
    {key:'missing',label:'ผู้สูญหาย',unit:'ราย',color:'#be123c'},
    {key:'vulnerable',label:'กลุ่มเปราะบางที่ช่วยเหลือ',unit:'ราย',color:'#0d9488'}
  ];
  function metric(report, key) {
    if (key === 'rain') return number(report?.rain);
    if (key === 'affected') return sum(rows(report,'areas').map(row=>row.people));
    if (['households','villages'].includes(key)) return sum(rows(report,'areas').map(row=>row[key]));
    if (key === 'vulnerable') return sum(rows(report,'vulnerable').map(row=>row.count));
    const type = {deaths:'เสียชีวิต',injuries:'บาดเจ็บ',missing:'สูญหาย'}[key];
    return type ? sum(rows(report,'population').filter(row=>String(row.type||'').includes(type)).map(row=>row.count)) : null;
  }
  function daily(records, districts, date) {
    return districts.map(district=>{
      const saved = records.filter(row=>row.districtId===district.id && row.reportDate===date)
        .sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
      const submitted = isSubmitted(saved);
      return {district, report:saved || null, submitted, risk:!submitted?'ยังไม่ส่ง':
        /เสี่ยงสูง|วิกฤต/.test(saved.status)?'เสี่ยงสูง / วิกฤต':
        /เฝ้าระวัง/.test(saved.status)?'เฝ้าระวัง':saved.status==='ปกติ'?'ปกติ':'ไม่ระบุสถานะ'};
    });
  }
  function total(dailyRows,key) {
    const values=dailyRows.filter(row=>row.submitted).map(row=>metric(row.report,key)).filter(value=>value!==null);
    return {value:values.length?sum(values):null,sources:values.length};
  }
  function history(records,districts,date,key) {
    return Array.from({length:7},(_,index)=>{
      const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-6+index);
      const dateKey=day.toISOString().slice(0,10),entries=daily(records,districts,dateKey);
      return {date:dateKey,...total(entries,key),submitted:entries.filter(row=>row.submitted).length};
    });
  }
  const api={isSubmitted,number,sum,metrics,metric,daily,total,history};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.DashboardData=api;
})(typeof window!=='undefined'?window:this);
