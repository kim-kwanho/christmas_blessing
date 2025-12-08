import './Header.css'

function Header({ onMenuClick }) {
    return (
        <header className="header">
            <button className="menu-btn" onClick={onMenuClick}>☰</button>
            <h1>크리스마스 평안네컷</h1>
        </header>
    )
}

export default Header

