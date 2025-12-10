// 인생네컷 프레임 데이터
export const frames = [
    {
        id: 1,
        name: 'Hope',
        layout: {
            // 4개 구역의 위치와 크기 (비율 기준) - 2x2 그리드, 프레임을 완전히 가득 채움
            // 프레임 내부 영역(frameInnerHeight)을 기준으로 하단 텍스트 영역을 제외한 전체를 2등분
            // frameInnerHeight = 전체 높이 - frameBorderWidth - bottomHeight
            // 슬롯이 frameInnerHeight를 완전히 채우도록: 각 슬롯 높이 = frameInnerHeight / 2
            // frameInnerHeight는 전체 높이의 약 0.92 (하단 0.08 제외)이므로
            // 슬롯 높이는 frameInnerHeight 기준으로 0.5씩 차지
            slots: [
                { x: 0, y: 0, width: 0.5, height: 0.5 }, // 좌상 - 프레임 내부 영역 기준
                { x: 0.5, y: 0, width: 0.5, height: 0.5 }, // 우상
                { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // 좌하
                { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }  // 우하
            ],
            frameColor: '#F5F5F0', // 클라우드 댄서 (PANTONE 11-4201) - 부드러운 화이트 뉴트럴
            frameWidth: 15,
            slotColor: '#F5F5F0', // 클라우드 댄서 톤
            bottomText: 'Hope',
            title: '',
            textColor: '#8B8B83' // 클라우드 댄서와 어울리는 부드러운 그레이 톤
        }
    },
    {
        id: 2,
        name: 'Merry Christmas',
        layout: {
            // 4개 구역의 위치와 크기 (비율 기준) - 2x2 그리드, 프레임을 완전히 가득 채움
            // 프레임 내부 영역(frameInnerHeight)을 기준으로 하단 텍스트 영역을 제외한 전체를 2등분
            slots: [
                { x: 0, y: 0, width: 0.5, height: 0.5 }, // 좌상 - 프레임 내부 영역 기준
                { x: 0.5, y: 0, width: 0.5, height: 0.5 }, // 우상
                { x: 0, y: 0.5, width: 0.5, height: 0.5 }, // 좌하
                { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }  // 우하
            ],
            frameColor: '#DC143C', // 크리스마스 빨간색
            frameWidth: 20,
            slotColor: '#FFFFFF', // 흰색 슬롯 배경
            bottomText: 'Merry Christmas',
            title: '🎄'
        }
    },
];

