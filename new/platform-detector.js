// 플랫폼별 판별 규칙 + 릴리스 에셋 매칭 규칙
// 주의: 배열 순서가 곧 우선순위다. Android UA에는 "Linux"도 들어있으므로
//       반드시 android를 linux보다 먼저 검사해야 한다.
const PLATFORMS = {
  android: {
    label: 'download_android',
    test: (ua) => /Android/i.test(ua),
    asset: /\.apk$/i,
    fallback: 'https://github.com/ZeroMayo/AX-Player/releases/latest/download/io.zeromayo.axplayer.apk'
  },
  windows: {
    test: (ua) => /Windows NT|Win64|Win32|WOW64/i.test(ua),
    label: 'download_windows',
    asset: /win.*\.(exe|msi)$/i,
    fallback: 'https://github.com/ZeroMayo/AX-Player/releases/latest/download/AXPlayer-win-Setup.exe'
  },
  linux: {
    label: 'download_linux',
    // ChromeOS(CrOS)는 Android 앱도 데스크톱 리눅스 앱도 아니라서 제외한다
    test: (ua) => /Linux|X11/i.test(ua) && !/CrOS/i.test(ua),
    asset: /\.(AppImage|deb|rpm)$/i,
    fallback: 'https://github.com/ZeroMayo/AX-Player/releases/latest/download/AXPlayer-linux-x64.AppImage'
  }
};

const PLATFORM_ORDER = ['android', 'windows', 'linux'];
const DEFAULT_PLATFORM = 'windows';

let latestRelease = null;

function detectPlatform(userAgent) {
  const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  for (const key of PLATFORM_ORDER) {
    if (PLATFORMS[key].test(ua)) return key;
  }
  return DEFAULT_PLATFORM;
}

function pickAssetUrl(release, platform) {
  const rule = PLATFORMS[platform];
  const asset = release && release.assets
    ? release.assets.find(a => rule.asset.test(a.name))
    : null;
  return asset ? asset.browser_download_url : rule.fallback;
}

function getDownloadUrl(platform) {
  const target = platform || detectPlatform();
  return pickAssetUrl(latestRelease, target);
}

function downloadClient()
{
	const platform = detectPlatform();

	console.log("The platform is " + platform + " (" + window.navigator.userAgent + ")");

	window.location.href = getDownloadUrl(platform);
}

async function getLatestRelease(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        // 인증이 필요한 private repo인 경우 아래 주석 해제
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Latest Version:', data.tag_name);
    console.log('Release Name:', data.name);
    console.log('Download URL:', data.html_url);
	
	latestRelease = data;

	const platform = detectPlatform();
	var elem = document.getElementById("dl_text");

	console.log("The platform is " + platform + " (" + window.navigator.userAgent + ")");
	
	var key = PLATFORMS[platform].label;
	var lang = getLang();
	elem.innerHTML = translate(key, lang).replace("{version}", data.name);
	
    return data;
  } catch (error) {
    console.error('Failed to fetch latest release:', error);
  }
}

// 예시: ultralytics/yolov5
getLatestRelease('ZeroMayo', 'AX-Player');

function getLang() {
    var lang = (navigator.languages != undefined)?navigator.languages[0]:navigator.language;
    // Ignore country code (example: en-US -> en)
    return lang.split("-")[0];
}
     
function translate(key, lang) {
    return (lang in dictionary)?dictionary[lang][key]:dictionary['_'][key];
}
