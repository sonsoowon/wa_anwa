const API_ROOT = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/';
const API_KEY = process.env.FCST_REST_API_KEY;
const region = {x:61, y:126};


// 현재 날짜, 시각을 YYYYMMDD, HH, MM 형태로 반환하는 함수
const getNowDateTime = () => {
    const d = new Date();
    const koreaDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
    const YMD = koreaDate.toISOString().split('T')[0].replaceAll('-', '');
    const HM = koreaDate.toISOString().split('T')[1].slice(0, 5).split(':');

    return {'date': YMD, 'time': {'hour': HM[0], 'min': HM[1]}}
}

// 단기 예보 조회를 위한 baseTime 설정 함수
const getLongBaseTime = () => {
    const nowDateTime = getNowDateTime();
    let date = parseInt(nowDateTime.date);
    let H = parseInt(nowDateTime.time.hour);
    let M = parseInt(nowDateTime.time.min);

    for (let i = 0; i < 8; i++){
        if ( H + M < 100 * (3 * i + 2) + 10 ){
            H = 3 * (i - 1) + 2;
            if (i == 0){
                date -= 1;
                H = 23;
            }

            H = H.toString().padStart(2, '0')
            return {baseDate: date, baseTime: H + '00'};
        }
    }

    return {baseDate: date - 1, baseTime: '2300'};
}

const getShortBaseTime = () => {
    const nowDateTime = getNowDateTime();
    let date = parseInt(nowDateTime.date);
    let H = parseInt(nowDateTime.time.hour);
    const M = parseInt(nowDateTime.time.min);

    if (M < 30) {
        H -= 1
        if (H == 0){
            date -= 1;
            H = 23;
        }
    }

    return {baseDate: date, baseTime: H.toString().padStart(2, '0') + '30'}

}

const getFirstFcstTime = () => {
    const sb = getShortBaseTime();
    const t = parseInt(sb.baseTime.slice(0, 2)) + 7;
    
    const fcstDate = parseInt(sb.baseDate) + parseInt(t / 24);
    const fcstTime = (t % 24).toString().padStart(2, '0');
    
    return {firstFcstDate: fcstDate, firstFcstTime: fcstTime + '00'};
}



// 현재 시각을 기준으로 6시간 이내의 예보를 반환하는 함수 (초단기 예보)
const getShortFcstList = async (region, cb) => {
    const apiUri =  API_ROOT + 'getUltraSrtFcst';
    
    sb = getShortBaseTime();

    const ptyParam = { // 강수상태 조회를 위한 param
            ServiceKey: API_KEY,
            pageNo: 2,
            numOfRows: 6,
            dataType: "JSON",
            base_date: sb.baseDate,
            base_time: sb.baseTime,
            nx: region.x, ny: region.y
    }

    const skyParam = { // 하늘상태 조회를 위한 param
            ServiceKey: API_KEY,
            pageNo: 4,
            numOfRows: 6,
            dataType: "JSON",
            base_date: sb.baseDate,
            base_time: sb.baseTime,
            nx: region.x, ny: region.y
    }

    
    
    let fcstList = [];
    const shortPTYFcstResponse = await axios.get(apiUri, {params: ptyParam});
    const shortSKYFctResponse = await axios.get(apiUri, {params: skyParam});


    const ptyList = shortPTYFcstResponse.data.response.body.items.item;
    const skyList = shortSKYFctResponse.data.response.body.items.item;

    for (let i=0; i < 6; i++){
        const item = ptyList[i];
        fcstList.push({
            fcstDate: item.fcstDate,
            fcstTime: item.fcstTime,
            pty: item.fcstValue,
            sky: skyList[i].fcstValue,
            x: item.nx, y: item.ny 
        });
    }
    
    return fcstList;
}

const getLongFcstList = async (region) => {
    const apiUri = API_ROOT + 'getVilageFcst';
    const lb = getLongBaseTime();
    
    const param = { // 강수상태 조회를 위한 param
        ServiceKey: API_KEY,
        pageNo: 1,
        numOfRows: 300,
        dataType: "JSON",
        base_date: lb.baseDate,
        base_time: lb.baseTime,
        nx: region.x, ny: region.y
    }


    const longFcstResponse = await axios.get(apiUri, {params:param});
    const longFcstList =  longFcstResponse.data.response.body.items.item;

    const firstFcst = getFirstFcstTime();
    
    let idx = 0;
    let fcstList = [];
    longFcstList.forEach((res) => {
        if(idx == 7)
            return fcstList;

        if (res.fcstDate >= firstFcst.firstFcstDate && res.fcstTime >= firstFcst.firstFcstTime){
            if (res.category === 'SKY'){
                fcstList.push({
                    fcstDate: res.fcstDate,
                    fcstTime: res.fcstTime,
                    sky: res.fcstValue,
                    pty: '0',
                    x: res.nx, y: res.ny
                });
                idx++;
                        
            } else if (res.category === 'PTY'){
                fcstList[idx - 1].pty = res.fcstValue;
            }       
        }
        
    });

    return fcstList;

}



const setList = async () => {
    const shortData = await getShortFcstList(region);
    const longData = await getLongFcstList(region);
    
    
}