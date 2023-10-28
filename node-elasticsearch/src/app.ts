import express from 'express';
import {Client} from '@elastic/elasticsearch'
const app = express();
const port = 5678;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

// 엘라스틱서치 셋팅
const client = new Client({
    node: 'http://localhost:9200',      // 엘라스틱서치 url
    // 만약 https 으로 셋팅 했다면 아래 auth 필드를 이용해서 엘라스틱서치의 접속 정보를 입력합니다.
    // auth: {
    //     apiKey: { // API key ID and secret
    //         id: 'foo',
    //         api_key: 'bar',
    //     }
    // }
    maxRetries: 5,                      /* 재시도 횟수를 설정할 수 있습니다. (default: 3) */
    requestTimeout: 60000,              /* 응답 요청 타임 아웃 시간을 정할 수 있습니다. (default: 30000) */
    sniffOnStart: true,                 /* 엘라스틱 서치의 sniffing 이라는 기능을 클라이언트 객체 생성때 진행합니다. */
})

async function yjyoon_elasticsearch_module_init() {
    try {
        await client.ping()
        console.log('Elasticsearch Client Setting SUCCESS')
    } catch (error) {
        throw error
    }
}

yjyoon_elasticsearch_module_init()

app.listen(port, function() {
    console.log(`host connection port ${port}`);
});

app.get('/', (req, res) => {
    res.send({
        "message": "server check"
    });
});
