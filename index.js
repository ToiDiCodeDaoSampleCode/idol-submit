// Sử dụng thư viện
var request = require('sync-request');

// Lấy danh sách idol từ file filtered-idols.json
var idols = require('./filtered-idols.json');

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

// Tạo idol trên hệ thống
function submitIdol(idol) {
    let url = `https://api.projectoxford.ai/face/v1.0/persongroups/${groupId}/persons`;
    console.log(`Begin submit idol: ${idol.id} - ${idol.name}`);
    var res = request('POST', url, {
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        json: {
            name: idol.name,
            userData: idol.id
        }
    });

    if (res.statusCode == 200) {
        var person = JSON.parse(res.getBody('utf8'));

        console.log(`SUCCESS - Submit idol ${idol.id} - ${idol.name}. Person ID: ${person.personId}`);

        // Bỏ 4 ảnh đầu
        for (let i = 4; i < idol.images.length; i++) {
            // Submit ảnh của idol lên hệ thống
            try {
                submitIdolFace(person.personId, idol.images[i].image);
                sleep(4*1000); // Sleep 4 giây vì limit 20 call/phút
            } catch (err) {
                console.log('ERROR');
                console.log(err);
            }
        }
    } else {
        console.log(res.getBody('utf8'));
    }

}

// Submit ảnh của idol lên hệ thống
function submitIdolFace(personId, faceUrl) {
    console.log(`Begin submit image ${faceUrl.substring(20,60)} for person id ${personId}`);
    let url = `https://api.projectoxford.ai/face/v1.0/persongroups/${groupId}/persons/${personId}/persistedFaces`;
    var res = request('POST', url, {
        headers: {
            'Ocp-Apim-Subscription-Key': key
        },
        json: {
            url: faceUrl
        }
    });

    if (res.statusCode == 200) {
        console.log(`SUCCESS - Submit image ${faceUrl.substring(20,60)} for person id ${personId}.`);
    }
}

for (let idol of idols) {
    submitIdol(idol);
}