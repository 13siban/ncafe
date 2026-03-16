import { NextRequest, NextResponse } from 'next/server';
import { IronSession } from 'iron-session';

// Sharp는 동적 import (모듈 누락 시에도 라우트가 동작하도록)
let sharpModule: typeof import('sharp') | null = null;
try {
    sharpModule = require('sharp');
} catch {
    console.warn('[BFF] Sharp not available, image compression disabled');
}

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';
const CHAT_SERVER_BASE = process.env.CHAT_SERVER_URL || 'http://localhost:8000';

/** API 프록시 (Spring Boot / FastAPI / 이미지) */
export async function handleProxy(req: NextRequest, session: IronSession<any>) {
    const { pathname } = req.nextUrl;
    const search = req.nextUrl.search;

    // 대상 서버 및 경로 결정
    let backendPath = pathname;
    let targetBase = API_BASE;

    if (pathname.startsWith('/api/vector/')) {
        targetBase = CHAT_SERVER_BASE;
    } else if (pathname.startsWith('/api/')) {
        backendPath = pathname.replace(/^\/api/, '');
    } else if (pathname.startsWith('/images/')) {
        backendPath = pathname.replace(/^\/images/, '/upload');
    }

    const targetUrl = `${targetBase}${backendPath}${search}`;

    const headers: Record<string, string> = {};
    const contentType = req.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    let requestBody: BodyInit | null = null;

    if (hasBody) {
        try {
            if (contentType && contentType.includes('multipart/form-data')) {
                const formData = await req.formData();
                const newFormData = new FormData();

                for (const [key, value] of formData.entries()) {
                    if (value instanceof Blob && value.type.startsWith('image/')) {
                        try {
                            if (sharpModule) {
                                const buffer = Buffer.from(await value.arrayBuffer());
                                const compressedBuffer = await sharpModule(buffer)
                                    .resize({ width: 1200, withoutEnlargement: true })
                                    .webp({ quality: 80 })
                                    .toBuffer();

                                const originalName = (value as File).name || 'image.jpg';
                                const newFileName = originalName.replace(/\.[^/.]+$/, "") + ".webp";
                                const newFile = new Blob([new Uint8Array(compressedBuffer)], { type: 'image/webp' });
                                newFormData.append(key, newFile, newFileName);
                            } else {
                                newFormData.append(key, value);
                            }
                        } catch (e) {
                            console.error("Image compression failed", e);
                            newFormData.append(key, value);
                        }
                    } else {
                        newFormData.append(key, value);
                    }
                }

                requestBody = newFormData;
                delete headers['Content-Type'];
            } else {
                const buffer = await req.arrayBuffer();
                if (buffer.byteLength > 0) {
                    requestBody = buffer;
                }
            }
        } catch (e) {
            console.error('Failed to read request body:', e);
        }
    }

    try {
        const proxyRes = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: requestBody,
        });

        if (proxyRes.status === 401 && session.token) {
            session.destroy();
        }

        const responseHeaders = new Headers();
        const resContentType = proxyRes.headers.get('content-type');
        if (resContentType) responseHeaders.set('Content-Type', resContentType);

        return new NextResponse(proxyRes.body, {
            status: proxyRes.status,
            statusText: proxyRes.statusText,
            headers: responseHeaders,
        });
    } catch (e: any) {
        console.error('Proxy error:', e);
        return NextResponse.json(
            { message: `백엔드 서버와 통신 중 오류가 발생했습니다: ${e.message}` },
            { status: 500 }
        );
    }
}
