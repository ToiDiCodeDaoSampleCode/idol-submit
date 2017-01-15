// Sử dụng thư  viện
var request = require('sync-request');

// Đọc thông tin idol trong file filtered-idols.json và thông tin person đã lưu từ API
var idols = require('./filtered-idols.json');
var idolPerson = require('./idol-person.json');

var falseData = require('./falseData.json');

let key = '91bc85*******'; // Thay thế bằng key của bạn
let groupId = 'vav-idols';

// NodeJS không có thread.sleep nên ra dùng tạm function này
function sleep(time) {
    console.log('Begin Sleep');
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    console.log('End Sleep');
}

// Phát hiện khuôn mặt trong ảnh (Face Detection)
function detect(imageUrl) {
    console.log(`Begin to detect face from image: ${imageUrl}`);
    let url = `https://api.projectoxford.ai/face/v1.0/detect`;
    var res = request('POST', url, {
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        json: {
            url: imageUrl
        }
    });

    if (res.statusCode == 200) {
        var result = JSON.parse(res.getBody('utf8'));
        console.log(`Found ${result.length} faces.`);
        return result;
    }
}

// Tìm khuôn mặt giống nhất trong Person Group (Face Recognition)
function identify(faceIds) {
    console.log(`Begin to identity face.`);
    let url = 'https://api.projectoxford.ai/face/v1.0/identify';
    var res = request('POST', url, {
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        json: {
            "personGroupId": groupId,
            "faceIds": faceIds,
            "maxNumOfCandidatesReturned": 1,
        }
    });

    if (res.statusCode == 200) {
        console.log(`Finish identity face.`);
        return JSON.parse(res.getBody('utf8'));
    } else {
        console.log('Error');
        console.log(res.getBody('utf8'));
    }
}

// Nhận diện vị trí khuôn mặt và tên idol từ URL ảnh
function recognize(imageUrl) {
    console.log(`Begin to recognize image: ${imageUrl}`);
    var detectedFaces = detect(imageUrl);

    if (detectedFaces.length == 0) {
        console.log("Can't detect any face");
        return;
    }

    // Sau khi đã phát hiện các khuôn mặt,
    // So sánh chúng với mặt đã có trong person group
    var identifiedResult = identify(detectedFaces.map(face => face.faceId));

    var allIdols = identifiedResult.map(result => {

        // Lấy vị trí khuôn mặt trong ảnh để hiển thị
        result.face = detectedFaces.filter(face => face.faceId == result.faceId)[0].faceRectangle;

        // Tìm idol đã được nhận diện từ DB
        if (result.candidates.length > 0) {

            // Kết quả chỉ trả về ID, dựa vào ID này ta tìm tên của idol
            var idolId = result.candidates[0].personId;
            var idol = idolPerson.filter(person => person.personId == idolId)[0];
            result.idol = {
                id: idol.userData,
                name: idol.name
            };
        } else {
            result.idol = {
                id: 0,
                name: 'Unknown'
            }
        }
        return result;
    });

    console.log(`Finish recognize image: ${imageUrl}`);
    return allIdols;
}

function getPositiveTestData() {
    var testData = [];
    for (let idol of idols) {
        for (let i = 0; i < 4; i++) {
            let image = idol.images[i].image;
            testData.push({
                id: idol.id,
                name: idol.name,
                image: image
            });
        }
    }
    return testData;
}

function runPositiveTest() {
    var positiveTestData = getPositiveTestData();
    let total = 0;
    let truePositive = 0;

    for(let data of positiveTestData) {
        try {
           let result = recognize(data.image); 
           if (result[0].idol.id == data.id) {
               truePositive++;
               console.log(`HIT: ${data.id} - ${data.name}`);
           } else {
               console.log(`MISS. Data ${data.id} - ${data.name}. Found ${result[0].idol.id} - ${result[0].idol.name}`);
           }
           total++;
           console.log(`True Positive: ${truePositive}. Total ${total}`);

           sleep(7*1000); // Sleep 7s vì mỗi lần recognize là 2 calls. Limit 1 phút/ 20 calls
        } catch (error) {
            console.log(error);
        } 
    }
}

function getNegativeTestData() {
    var testData = [];
    for (let idol of falseData) {
        for (let i = 0; i < 10; i++) {
            let image = idol.images[i].image;
            testData.push({
                id: 0,
                name: 'Unknown',
                image: image
            });
        }
    }
    return testData;
}

function runNegativeTest() {
    var negativeTestData = getNegativeTestData();
    let total = 0;
    let trueNegative = 0;

    for(let data of negativeTestData) {
        try {
           let result = recognize(data.image); 
           if (result[0].idol.id == data.id) {
               trueNegative++;
               console.log(`HIT: ${data.id} - ${data.name}`);
           } else {
               console.log(`MISS. Data ${data.id} - ${data.name}. Found ${result[0].idol.id} - ${result[0].idol.name}`);
           }
           total++;
           console.log(`True Negative: ${trueNegative}. Total ${total}`);

           sleep(7*1000); // Sleep 7s vì mỗi lần recognize là 2 calls. Limit 1 phút/ 20 calls
        } catch (error) {
            console.log(error);
        } 
    }
}


/*
// Chạy test độ chính xác của API
runPositiveTest();

runNegativeTest();
*/


/*
// Test method recognize
var result = recognize('http://khampha.vn/upload/2-2013/images/2013-06-08/1370661797-_2013_01_28_ba13cd4ab481b5af97d3b9f7060ecc1c_1338598160_ngoc_trinh__7_.jpg');
console.log(JSON.stringify(result, null, 2));
*/