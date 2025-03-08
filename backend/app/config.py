USE_RAILWAY = False

USE_CLIP = True
USE_BLIP = False
USE_WEBUI = True

PARALLEL_MODE = False

WEBUI_URL1 = "https://e0u886fiy1x6h8-3001.proxy.runpod.net/"
WEBUI_URL2 = "https://e0u886fiy1x6h8-3001.proxy.runpod.net/"
BLIP_URL   = "https://mm05wbqtthcrkn-3002.proxy.runpod.net/"

PORT = 8080
HOST = "192.168.46.155"

if USE_RAILWAY:
    BACKEND_URL = "https://articket-production.up.railway.app" # 배포된 백엔드 URL
else:
    BACKEND_URL = f'http://{HOST}:{PORT}'

UPLOAD_FOLDER  = './static/uploads'
GENERATED_FOLDER = './static/generated'

ARTISTS = {
    '리히텐슈타인': {
        'description': '세련된 일상의 리히텐슈타인',
        'modifier': 'pop art,<lora:loy2_xl:1>,masterpiece,best quality, background with a Ben-Day dots,portrait, artwork in the style of Roy Lichtenstein, pop art, bold primary colors, thick black outlines, comic book style, retro aesthetica, ',
        'negative_prompt': {
            'male': 'feminine,lipstick,red lips,makeup,beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 150,
        'denoising_strength': 0.7,
        'cfg_scale': 7,
    },
    '고흐': {
        'description': '감정과 열정의 섬세한 고흐',
        'modifier': 'painting,<lora:gogh_xl:1>,masterpiece,best quality,Starry Night of Gogh,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,yellow face',
        },
        'steps': 100,
        'denoising_strength': 0.65,
        'cfg_scale': 7,
    },
    '피카소': {
        'description': '대담하고 창의적인 피카소',
        'modifier': 'illustration,style of Pablo Picasso,<lora:picasso_xl:0.6>,masterpiece,best quality, portrait,cubism,abstract shapes,fragmented forms,bold lines,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 120,
        'denoising_strength': 0.66,
        'cfg_scale': 7,
    },
    '르누아르': {
        'description': '낙천적이고 따뜻한 르누아르',
        'modifier': 'oil painting,style of Auguste Renoir,  <lora:renior2_xl:0.6>,masterpiece,best quality, portrait,',
        'negative_prompt': {
            'male': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
            'female': 'beard,mustache,facial hair,senescent,lowres,bad anatomy,bad hands,text,error,missing fingers,extra digit,fewer digits,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,nsfw,',
        },
        'steps': 100,
        'denoising_strength': 0.63,
        'cfg_scale': 7,
    }
}