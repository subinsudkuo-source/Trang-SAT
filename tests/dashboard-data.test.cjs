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
