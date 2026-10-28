const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../dashboard-data.js');
const districts=[{id:'d01',thai:'เมืองตรัง'},{id:'d02',thai:'กันตัง'},{id:'d03',thai:'นาโยง'}];
const report=(extra={})=>({districtId:'d01',reportDate:'2026-10-28',submitted:true,status:'เฝ้าระวัง',rain:0,floodReport:{areas:[{people:0,households:'',villages:2}]},...extra});
test('blanks, invalid numbers and explicit zero stay distinct',()=>{
  for(const value of ['', '  ',null,undefined,false,'invalid',-1,Infinity])assert.equal(D.number(value),null);
  assert.equal(D.number('1,234'),1234);assert.equal(D.sum(['',0]),0);assert.equal(D.sum(['',null]),null);
  assert.equal(D.metric(report(),'affected'),0);assert.equal(D.metric(report(),'households'),null);
});
test('only submitted reports from the selected date and known districts contribute',()=>{
  const data=D.daily([report(),report({districtId:'d02',submitted:'false',rain:100}),report({districtId:'d03',reportDate:'2026-10-27',rain:200}),report({districtId:'unknown',rain:999})],districts,'2026-10-28');
  assert.equal(data.filter(row=>row.submitted).length,1);
  assert.deepEqual(D.total(data,'affected'),{value:0,sources:1});
  assert.equal(data[1].risk,'ยังไม่ส่ง');assert.equal(data[2].report,null);
});
test('string submission flags and duplicate rows are normalized without double counting',()=>{
  assert.equal(D.isSubmitted({submitted:'TRUE'}),true);assert.equal(D.isSubmitted({submitted:'false'}),false);
  const data=D.daily([report({updatedAt:'2026-10-28T01:00:00Z'}),report({submitted:'TRUE',updatedAt:'2026-10-28T02:00:00Z',status:'วิกฤต',floodReport:{areas:[{people:25},{people:'5'}]}})],districts,'2026-10-28');
  assert.deepEqual(D.total(data,'affected'),{value:30,sources:1});assert.equal(data[0].risk,'เสี่ยงสูง / วิกฤต');
});
test('seven day history preserves gaps and crosses month and year boundaries',()=>{
  const points=D.history([report({reportDate:'2026-12-31'}),report({reportDate:'2027-01-02',floodReport:{areas:[{people:7}]}})],districts,'2027-01-02','affected');
  assert.equal(points.length,7);assert.equal(points[0].date,'2026-12-27');assert.equal(points[4].value,0);assert.equal(points[5].value,null);assert.equal(points[6].value,7);assert.equal(points[6].sources,1);
});
test('casualty and vulnerable metrics use the correct report fields',()=>{
 const r=report({floodReport:{population:[{type:'เสียชีวิต',count:1},{type:'ได้รับบาดเจ็บ',count:3},{type:'สูญหาย',count:0}],vulnerable:[{count:2},{count:3}]}});
 assert.equal(D.metric(r,'deaths'),1);assert.equal(D.metric(r,'injuries'),3);assert.equal(D.metric(r,'missing'),0);assert.equal(D.metric(r,'vulnerable'),5);
 assert.deepEqual(D.total(D.daily([],districts,'2026-10-28'),'affected'),{value:null,sources:0});
});
test('all form 2570 numerical sections use their original fields and preserve blanks',()=>{
 const r=report({floodReport:{staff:[{type:'เสียชีวิต',count:1,families:2,homes:0},{type:'ได้รับบาดเจ็บ',count:3,families:4,homes:1}],normalHospitals:0,normalPcu:'',partialHospitals:2,partialPcu:1,closedCount:'1',partial:[{damage:1500}],closed:[{damage:2000}],mobile:[{units:2,visits:3,patients:11,education:8}],assessed:20,highStress:0,depression:2,suicideRisk:'',ptsd:1,specialCare:3,sanitation:[{people:4}],medicine:[{quantity:5}],shelters:[{people:6}],mentalAid:[{people:7}]}});
 const expected={staffDeaths:1,staffInjuries:3,staffFamilies:6,staffHomes:1,normalHospitals:0,normalPcu:null,partialHospitals:2,partialPcu:1,closedCount:1,partialDamage:1500,closedDamage:2000,medicalUnits:2,medicalVisits:3,medicalPatients:11,education:8,assessed:20,highStress:0,depression:2,suicideRisk:null,ptsd:1,specialCare:3,sanitationPeople:4,medicineKits:5,shelterPeople:6,mentalAidPeople:7};
 assert.equal(Object.keys(expected).length,Object.keys(D.detailMetrics).length);
 for(const [key,value] of Object.entries(expected))assert.equal(D.metric(r,key),value,key);
});
test('detail rows keep district, period and differing units without summing support requests',()=>{
 const r=report({floodReport:{aidStart:'2026-10-01',aidEnd:'2026-10-28',support:[{item:'ยา',quantity:0,unit:'ชุด'},{item:'รถ',quantity:2,unit:'คัน'},{}]}});
 const data=D.daily([r,report({districtId:'d02',submitted:false,floodReport:{support:[{item:'ร่าง',quantity:99}]}})],districts,'2026-10-28');
 const detail=D.detailRows(data,'support');assert.equal(detail.length,2);assert.equal(detail[0].quantity,0);assert.equal(detail[0]._district,'เมืองตรัง');assert.equal(detail[0]._report.floodReport.aidStart,'2026-10-01');assert.equal(detail[1].unit,'คัน');assert.equal(r.floodReport.support[0]._district,undefined);
});
test('vulnerable chart retains all eight categories, zero and unknown types',()=>{
 const data=D.daily([report({floodReport:{vulnerable:[{type:'เด็กเล็ก',count:0},{type:'ผู้สูงอายุ',count:3},{type:'ผู้สูงอายุ',count:2},{count:1}]}})],districts,'2026-10-28');
 const groups=D.vulnerableGroups(data);assert.equal(groups.find(g=>g.name==='เด็กเล็ก').value,0);assert.equal(groups.find(g=>g.name==='ผู้สูงอายุ').value,5);assert.equal(groups.find(g=>g.name==='คนพิการ').value,null);assert.equal(groups.find(g=>g.name==='ไม่ระบุประเภท').value,1);
});
test('PHEOC separates saved report, attachments, missing groups and different dates',()=>{
 const reports=[{group:' SAT ',reportDate:'2026-10-28',actions:'เดิม',updatedAt:'2026-10-28T01:00:00Z'},{group:'SAT',reportDate:'2026-10-28',actions:'ล่าสุด',updatedAt:'2026-10-28T02:00:00Z'},{group:'Logistics',reportDate:'2026-10-27',actions:'เมื่อวาน'}];
 const files=[{id:'file1',group:'Logistics',reportDate:'2026-10-28'},{id:'file2',group:'Legacy',reportDate:'2026-10-28'}];
 const groups=D.pheocGroups(reports,files,['SAT','Logistics','MCATT'],'2026-10-28');
 assert.equal(groups.length,4);assert.equal(groups[0].report.actions,'ล่าสุด');assert.equal(groups[0].files.length,0);assert.equal(groups[1].report,null);assert.equal(groups[1].files.length,1);assert.equal(groups[2].report,null);assert.equal(groups[3].name,'Legacy');
});
