// PDF를 이미지로 변환하여 배경에 표시
async function loadPdfAsBackground() {
    try {
        // PDF.js 설정
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        // PDF 로드
        const loadingTask = pdfjsLib.getDocument('클블1.pdf');
        const pdf = await loadingTask.promise;
        
        // 첫 페이지 가져오기
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Canvas에 렌더링
        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        // Canvas를 이미지로 변환하여 배경에 설정
        const imageData = canvas.toDataURL('image/png');
        const backgroundElement = document.querySelector('.start-screen-background');
        if (backgroundElement) {
            backgroundElement.style.backgroundImage = `url(${imageData})`;
        }
        
        console.log('PDF 배경 이미지 로드 완료');
    } catch (error) {
        console.error('PDF 로드 실패:', error);
        // PDF 로드 실패 시 기본 배경 사용
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('시작 화면 초기화...');
    
    // PDF 배경 로드
    loadPdfAsBackground();
    
    // START 버튼 이벤트
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            console.log('START 버튼 클릭 - main.html로 이동');
            window.location.href = 'main.html';
        });
    }
});

