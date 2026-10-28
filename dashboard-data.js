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
  const detailMetrics = {
    staffDeaths:{label:'บุคลากรเสียชีวิต',unit:'ราย',table:'staff',field:'count',type:'เสียชีวิต'},
    staffInjuries:{label:'บุคลากรบาดเจ็บ',unit:'ราย',table:'staff',field:'count',type:'บาดเจ็บ'},
    staffFamilies:{label:'ครอบครัวบุคลากรได้รับผลกระทบ',unit:'ครอบครัว',table:'staff',field:'families'},
    staffHomes:{label:'บ้านบุคลากรได้รับผลกระทบ',unit:'หลัง',table:'staff',field:'homes'},
    normalHospitals:{label:'โรงพยาบาลเปิดปกติ',unit:'แห่ง'},normalPcu:{label:'รพ.สต. เปิดปกติ',unit:'แห่ง'},
    partialHospitals:{label:'โรงพยาบาลเปิดบางส่วน',unit:'แห่ง'},partialPcu:{label:'รพ.สต. เปิดบางส่วน',unit:'แห่ง'},
    closedCount:{label:'สถานบริการปิดให้บริการ',unit:'แห่ง'},
    partialDamage:{label:'ความเสียหายสถานบริการเปิดบางส่วน',unit:'บาท',table:'partial',field:'damage'},
    closedDamage:{label:'ความเสียหายสถานบริการปิด',unit:'บาท',table:'closed',field:'damage'},
    medicalUnits:{label:'จำนวนหน่วยแพทย์',unit:'หน่วย',table:'mobile',field:'units'},
    medicalVisits:{label:'ครั้งที่ให้บริการ',unit:'ครั้ง',table:'mobile',field:'visits'},
    medicalPatients:{label:'ผู้รับบริการรักษาพยาบาล',unit:'ราย',table:'mobile',field:'patients'},
    education:{label:'ผู้รับบริการสุขศึกษา',unit:'ราย',table:'mobile',field:'education'},
    assessed:{label:'ประเมินปัญหาสุขภาพจิต',unit:'ราย'},highStress:{label:'เครียดสูง',unit:'ราย'},depression:{label:'ซึมเศร้า',unit:'ราย'},
    suicideRisk:{label:'เสี่ยงต่อการฆ่าตัวตาย',unit:'ราย'},ptsd:{label:'PTSD',unit:'ราย'},specialCare:{label:'ต้องติดตามดูแลพิเศษ',unit:'ราย'},
    sanitationPeople:{label:'ผู้รับบริการสุขาภิบาล / ป้องกันโรค',unit:'ราย',table:'sanitation',field:'people'},
    medicineKits:{label:'ยาชุดช่วยเหลือผู้ประสบอุทกภัย',unit:'ชุด',table:'medicine',field:'quantity'},
    shelterPeople:{label:'ผู้รับการช่วยเหลือศูนย์พักพิง',unit:'ราย',table:'shelters',field:'people'},
    mentalAidPeople:{label:'ผู้รับการเยียวยาด้านจิตใจ',unit:'ราย',table:'mentalAid',field:'people'}
  };
  const vulnerableTypes=['เด็กเล็ก','ผู้สูงอายุ','คนพิการ','ผู้ป่วยติดเตียง','หญิงตั้งครรภ์','ผู้ป่วยโรคเรื้อรัง','ผู้ป่วยจิตเวช','ผู้ป่วยฟอกไต'];
  function metric(report, key) {
    const config=detailMetrics[key];
    if(config){
      if(!config.table)return number(report?.floodReport?.[key]);
      const selected=rows(report,config.table).filter(row=>!config.type||String(row.type||'').includes(config.type));
      return sum(selected.map(row=>row[config.field]));
    }
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
  function detailRows(dailyRows, key) {
    return dailyRows.filter(row=>row.submitted).flatMap(row=>rows(row.report,key)
      .filter(item=>Object.values(item||{}).some(value=>value!==null&&value!==undefined&&String(value).trim()!==''))
      .map(item=>({...item,_district:row.district.thai,_report:row.report})));
  }
  function vulnerableGroups(dailyRows){
    const data=detailRows(dailyRows,'vulnerable');
    const names=[...vulnerableTypes,...new Set(data.map(row=>String(row.type||'').trim()).filter(name=>!vulnerableTypes.includes(name)))];
    return names.map(name=>({name:name||'ไม่ระบุประเภท',value:sum(data.filter(row=>String(row.type||'').trim()===name).map(row=>row.count))}));
  }
  function pheocGroups(reports,files,expected,date){
    const dayReports=reports.filter(row=>row.reportDate===date),dayFiles=files.filter(row=>row.reportDate===date);
    const group=row=>String(row.group||'').trim();
    const groups=[...new Set([...expected,...dayReports.map(group),...dayFiles.map(group)].filter(Boolean))];
    return groups.map(name=>({name,report:dayReports.filter(row=>group(row)===name).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0]||null,files:dayFiles.filter(row=>group(row)===name)}));
  }
  const api={isSubmitted,number,sum,metrics,metric,daily,total,history,detailMetrics,vulnerableTypes,detailRows,vulnerableGroups,pheocGroups};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.DashboardData=api;
})(typeof window!=='undefined'?window:this);
