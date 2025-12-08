// 인생네컷 프레임 데이터
export const frames = [
    {
        id: 1,
        name: 'Yourself Film',
        layout: {
            // 4개 구역의 위치와 크기 (비율 기준) - 2x2 그리드
            slots: [
                { x: 0.05, y: 0.05, width: 0.44, height: 0.42 }, // 좌상
                { x: 0.51, y: 0.05, width: 0.44, height: 0.42 }, // 우상
                { x: 0.05, y: 0.48, width: 0.44, height: 0.42 }, // 좌하
                { x: 0.51, y: 0.48, width: 0.44, height: 0.42 }  // 우하
            ],
            frameColor: '#808080', // 회색 테두리
            frameWidth: 15,
            slotColor: '#B3D9FF', // 연한 파란색 슬롯 배경
            bottomText: 'yourself film',
            title: ''
        }
    },
    {
        id: 2,
        name: 'Merry Christmas',
        layout: {
            // 4개 구역의 위치와 크기 (비율 기준) - 2x2 그리드
            slots: [
                { x: 0.05, y: 0.05, width: 0.44, height: 0.42 }, // 좌상
                { x: 0.51, y: 0.05, width: 0.44, height: 0.42 }, // 우상
                { x: 0.05, y: 0.48, width: 0.44, height: 0.42 }, // 좌하
                { x: 0.51, y: 0.48, width: 0.44, height: 0.42 }  // 우하
            ],
            frameColor: '#DC143C', // 크리스마스 빨간색
            frameWidth: 20,
            slotColor: '#FFFFFF', // 흰색 슬롯 배경
            bottomText: 'Merry Christmas',
            title: '🎄'
        }
    },
];

