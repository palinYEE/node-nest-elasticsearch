import express, { NextFunction, Request, Response } from 'express';
import { Client } from '@elastic/elasticsearch'
import { AggregationsAggregate, SearchHit, SearchRequest, SearchResponse } from '@elastic/elasticsearch/lib/api/types';
const app = express();
const port = 5678;

function checkElasticsearchIndexInBody(req: Request, res: Response, next: NextFunction) {
    const indexName = req.body.index;
    if(!indexName) {
        res.status(400);
        res.send({
            message: "엘라스틱서치에 생성할 인덱스 이름을 작성해주세요.",
        });
    }
    next();
}

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
        const pingResult = await client.ping() // true or false
        console.log('Elasticsearch Client Setting SUCCESS')
        console.log(`Elasticsearch Ping Result: ${pingResult}`)
    } catch (error) {
        throw error
    }
}

yjyoon_elasticsearch_module_init()

app.listen(port, function() {
    console.log(`host connection port ${port}`);
});



/**
 * 엘라스틱서치의 인덱스 생성해주는 API 입니다. 해당 API를 사용하는데 필요한 body 형식은 아래와 같습니다. 
 * body: {
 *      index: string   // 생성할 인덱스 이름을 작성합니다.
 *      mapping?: object    // 생성할 인덱스의 매핑정보를 작성합니다. 본 필드는 optional 입니다.
 * }
 * response 종류는 아래와 같습니다. 
 *  - 성공시
 *      - 200: { message: `${indexName} 인덱스 생성에 성공하였습니다.`}
 *  - 실패시
 *      - 400: 
 *          - { message: "엘라스틱서치에 생성할 인덱스 이름을 작성해주세요.", } // index 필드가 누락되었을 경우
 *          - { message: `입력하신 "${indexName}"은 이미 존재하는 인덱스 입니다.` } // 이미 존재하는 index 이름일 경우
 *          - { message: (error as Error).message } // 기타 에러
 */
app.post('/es/create/index', checkElasticsearchIndexInBody, async (req: Request, res: Response) => {
    const indexName = req.body.index;
    try {
        const checkIndexExist = await client.indices.exists({index: indexName});
        if(!checkIndexExist) {
            res.status(400);
            res.send({
                message: `입력하신 "${indexName}"은 이미 존재하는 인덱스 입니다.`,
            });
        }
        const mapping = req.body.mapping ? req.body.mapping : {};
        console.log(`create elasticsearch index: ${indexName}, mapping: ${JSON.stringify(mapping)}`);
        const createResultFlag = await client.indices.create({index: indexName, mappings: mapping});
        console.log(createResultFlag);
        res.send({
            message: `${indexName} 인덱스 생성에 성공하였습니다.`
        })
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message,
        });
    }
})

/**
 * 엘라스틱서치 선택한 index 에 샘플 데이터를 넣는 API 입니다. 해당 API를 사용하는데 필요한 body 형식은 아래와 같습니다. 
 * body: {
 *      index: string       // 데이터를 삽입할 인덱스 이름
 *      data: object        // 삽입할 데이터
 * }
 * response 종류는 아래와 같습니다. 
 *  - 성공시
 *      - 200: { message: `${JSON.stringify(insertData)} 저장에 성공하였습니다.` }
 *  - 실패시
 *      - 400: 
 *          - { message: `인덱스 이름을 입력해주세요.` } // index 필드가 누락되었을 경우
 *          - { message: "삽입할 데이터를 작성해주세요." } // data 필드에 데이터가 없을 경우
 *          - { message: (error as Error).message } // 기타 에러
 */
app.post('/es/insert/data', checkElasticsearchIndexInBody, async (req: Request, res: Response) => {
    const insertData = req.body.data;
    const indexName = req.body.index;
    if(!insertData || JSON.stringify(insertData) === '{}') {
        res.status(400);
        res.send({
            message: "삽입할 데이터를 작성해주세요."
        })
    }
    try {
        await client.index({index: indexName, document: insertData});
        res.send({
            message: `${JSON.stringify(insertData)} 저장에 성공하였습니다.`
        })
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message,
        });
    }
})

/**
 * 엘라스틱서치 선책한 index 에 데이터를 가져오는 API 입니다. 해당 API를 사용하는데 필요한 body 형식은 아래와 같습니다. 
 * body: {
 *      index: string           // 데이터를 겁색할 인덱스 이름
 *      scrollFlag: boolean     // 데이터 서치 스크롤 사용 유무
 *      query: object           // 엘라스틱서치 search query
 * }
 * response 종류는 아래와 같습니다. 
 *  - 성공시
 *      - 200: { message: `${indexName} 인덱스에 검색을 성공하였습니다`, data: 검색 데이터 Array }
 *  - 실패시
 *      - 400: 
 *          - { message: `인덱스 이름을 입력해주세요.` } // index 필드가 누락되었을 경우
 *          - { message: `입력하신 "${indexName}"은 이미 존재하는 인덱스 입니다.` } // 이미 존재하는 index 이름일 경우
 *          - { message: (error as Error).message } // 기타 에러
 */
app.get('/es/get/data', checkElasticsearchIndexInBody, async (req: Request, res: Response) => {
    const indexName = req.body.index;
    const scrollFlag = req.body.scroll;
    const query = req.body.query;
    try {
        const allQuotes: SearchHit<unknown>[] = []
        const responseQueue: SearchResponse<unknown, Record<string, AggregationsAggregate>>[] = []
        const searchQuery: SearchRequest = {
            index: indexName, 
            query: query ? query: {}
        }
        if(scrollFlag) { searchQuery.scroll = '30s' }
        const searchResult = await client.search(searchQuery)
        responseQueue.push(searchResult);
        while(responseQueue.length) {
            const body = responseQueue.shift()!;

            body.hits.hits.forEach((hit) => {
                allQuotes.push(hit)
            });
            if(!scrollFlag) { break }

            let totalHits = 0; // totalHits를 기본값 0으로 초기화합니다.

            if (body.hits && body.hits.total) {
                // body.hits 또는 body.hits.total이 undefined가 아닌지 확인합니다.
                if (typeof body.hits.total === 'object') {
                    // Elasticsearch 7.x 이상의 경우, total은 객체입니다.
                    totalHits = body.hits.total.value;
                } else {
                    // 이전 버전의 Elasticsearch에서는 total이 직접 숫자입니다.
                    totalHits = body.hits.total;
                }
            } else {
                // body.hits 또는 body.hits.total이 없는 경우, 적절한 오류 메시지 또는 로깅을 수행할 수 있습니다.
                console.error("Unexpected response structure, 'hits' or 'total' field is missing.");
                throw new Error("Unexpected response structure, 'hits' or 'total' field is missing.")
            }

            if(totalHits === allQuotes.length) {
                break
            }

            responseQueue.push( await client.scroll({
                scroll_id: body._scroll_id,
                scroll: '30s'
            }));
        }
        res.send({
            message: `${indexName} 인덱스에 검색을 성공하였습니다`,
            data: allQuotes,
        });
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message,
        });
    }
});

/**
 * 엘라스틱서치 선택한 index 의 id에 해당하는 데이터를 삭제하는 API 입니다. 해당 API를 사용하는데 필요한 body 형식은 아래와 같습니다. 
 * body: {
 *      index: string           // 데이터를 겁색할 인덱스 이름
 *      id: string              // 도큐먼트 id 값
 * }
 * response 종류는 아래와 같습니다. 
 *  - 성공시
 *      - 200: { message: `${indexName} 인덱스의 ${id} id 삭제 성공하였습니다.`, data: 삭제 결과}
 *  - 실패시
 *      - 400:
 *          - { message: `인덱스 이름을 입력해주세요.` } // index 필드가 누락되었을 경우
 *          - { message: "삭제할 도큐먼트 id 값을 입력해주세요." } // id 값을 입력하지 않았을 경우
 *          - { message: (error as Error).message } // 기타 에러
 */
app.delete('/es/delete/data', checkElasticsearchIndexInBody, async (req: Request, res:Response) => {
    const indexName = req.body.index;
    const id = req.body.id;
    if(!id) {
        res.status(400);
        res.send({
            message: '삭제할 도큐먼트 id 값을 입력해주세요.'
        })
    }
    try {
        const deleteResult = await client.delete({id: id, index: indexName});
        res.send({
            message: `${indexName} 인덱스의 ${id} id 삭제 성공하였습니다.`,
            data: deleteResult
        })
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message,
        });
    }
});

/**
 * 엘라스틱서치 선택한 index 의 id에 해당하는 데이터를 업데이트 하는 API 입니다. 해당 API를 사용하는데 필요한 body 형식은 아래와 같습니다. 
 * body: {
 *      index: string           // 데이터를 겁색할 인덱스 이름
 *      id: string              // 도큐먼트 id 값
 *      data: object            // 업데이트할 데이터
 * }
 * response 종류는 아래와 같습니다. 
 *  - 성공시
 *      - 200: { message: `${indexName} 인덱스의 ${id} id 도큐먼트의 데이터 수정 성공하였습니다.`, data: 업데이트 결과}
 *  - 실패시
 *      - 400:
 *          - { message: `인덱스 이름을 입력해주세요.` } // index 필드가 누락되었을 경우
 *          - { message: "업데이트할 도큐먼트 id 값을 입력해주세요." } // id 값을 입력하지 않았을 경우
 *          - { message: "업데이트할 데이터를 입력해주세요." } // 데이터를 입력하지 않았을 경우
 *          - { message: (error as Error).message } // 기타 에러
 */
app.post('es/data/update', checkElasticsearchIndexInBody, async (req: Request, res: Response) => {
    const indexName = req.body.index;
    const id = req.body.id;
    const data = req.body.data;
    if(!id) { 
        res.status(400);
        res.send({
            message: '업데이트할 도큐먼트 id 값을 입력해주세요.'
        });
    }
    if(!data) {
        res.status(400);
        res.send({
            message: '업데이트할 데이터를 입력해주세요.'
        });
    }
    try {
        const updateResult = await client.update({index: indexName, id: id, doc: data});
        res.send({
            message: `${indexName} 인덱스의 ${id} id 도큐먼트의 데이터 수정 성공하였습니다.`,
            data: updateResult
        })
    } catch (error) {
        res.status(400);
        res.send({
            message: (error as Error).message
        });
    }
})