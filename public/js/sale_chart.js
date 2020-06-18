var ctx = document.getElementById("myChart");

var data = mon_data;
var label = mon_label;
var b_c = mon_bc;
var b_b = mon_bb;

var config = {
    type: 'bar',
    data: {
        labels: mon_label,
        datasets: [{
            label: '판매매출량',
            data: mon_data,
            backgroundColor: mon_bc,
            borderColor: mon_bb,
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
};
var myChart = new Chart(ctx,config);

document.getElementById('d_data').onclick = function(){
      
    //데이터셋 수 만큼 반복
    var dataset = config.data.datasets[0].data;
    var labelset = config.data.labels;
    var backgroundColor = config.data.datasets[0].backgroundColor;
    var borderColor = config.data.datasets[0].borderColor;
    dataset.length = 0;
    labelset.length = 0;
    backgroundColor.length = 0;
    borderColor.length = 0;

    var data = daily_data;
    var label = daily_label;
    var d_b = daily_bc;
    var d_bb = daily_bb;

    for(var i=0; i<data.length;i++){
        dataset[i] = data[i];
        labelset[i] = label[i];
        backgroundColor[i] = d_b[i];
        borderColor[i] = d_bb[i];
    }       
    myChart.update(); //차트 업데이트
}

document.getElementById('h_data').onclick = function(){
      
    //데이터셋 수 만큼 반복
    var dataset = config.data.datasets[0].data;
    var labelset = config.data.labels;
    var backgroundColor = config.data.datasets[0].backgroundColor;
    var borderColor = config.data.datasets[0].borderColor;
    dataset.length = 0;
    labelset.length = 0;
    backgroundColor.length = 0;
    borderColor.length = 0;

    var data = hour_data;
    var label = hour_label;
    var d_b = hour_bc;
    var d_bb = hour_bb;

    for(var i=0; i<data.length;i++){
        dataset[i] = data[i];
        labelset[i] = label[i];
        backgroundColor[i] = d_b[i];
        borderColor[i] = d_bb[i];
    }      
    myChart.update(); //차트 업데이트
}

document.getElementById('m_data').onclick = function(){
      
    //데이터셋 수 만큼 반복
    var dataset = config.data.datasets[0].data;
    var labelset = config.data.labels;
    var backgroundColor = config.data.datasets[0].backgroundColor;
    var borderColor = config.data.datasets[0].borderColor;
    dataset.length = 0;
    labelset.length = 0;
    backgroundColor.length = 0;
    borderColor.length = 0;

    var data = mon_data2;
    var label = mon_label2;
    var d_b = mon_bc2;
    var d_bb = mon_bb2;    
    for(var i=0; i<data.length;i++){
        dataset[i] = data[i];
        labelset[i] = label[i];
        backgroundColor[i] = d_b[i];
        borderColor[i] = d_bb[i];
    }

    myChart.update(); //차트 업데이트
}