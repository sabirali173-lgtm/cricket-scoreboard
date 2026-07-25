*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Arial, Helvetica, sans-serif;
}

body{
    width:1920px;
    height:1080px;
    overflow:hidden;
    background:transparent;
}

.scoreboard{
    position:absolute;
    bottom:40px;
    left:50%;
    transform:translateX(-50%);
    width:1400px;
    height:110px;
    background:rgba(0,0,0,.80);
    border-radius:20px;
    display:flex;
    justify-content:space-between;
    align-items:center;
    color:#fff;
    padding:0 40px;
    border:3px solid #00d4ff;
}

.team{
    display:flex;
    align-items:center;
    gap:15px;
}

.team img{
    width:70px;
    height:70px;
    border-radius:50%;
    object-fit:cover;
    background:#fff;
}

.team h2{
    font-size:34px;
    font-weight:bold;
    text-transform:uppercase;
}

.score{
    text-align:center;
}

.score h1{
    font-size:54px;
    color:#00ff66;
}

.score p{
    font-size:24px;
    margin-top:5px;
}

.bottomBar{
    position:absolute;
    bottom:0;
    left:50%;
    transform:translateX(-50%);
    width:1200px;
    height:40px;
    background:#0b4ea2;
    display:flex;
    justify-content:space-around;
    align-items:center;
    color:#fff;
    font-size:22px;
    border-radius:10px 10px 0 0;
}
