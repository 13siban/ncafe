package com.new_cafe.app.backend.controller;

import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Cookie;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/cookie")
public class CookieTestController {

    @GetMapping("/test")
    public Map<String, Object> cookieTest(
            @CookieValue(name = "age", required = false) String age,
            HttpServletRequest request,
            Principal principal) {

        Map<String, Object> response = new HashMap<>();

        // 인증 정보 추가 (로그인된 경우)
        if (principal != null) {
            response.put("username", principal.getName());
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            response.put("authorities", auth.getAuthorities());
        }

        response.put("name", "홍길동");
        response.put("age", age);

        HttpSession session = request.getSession();
        response.put("sessionName", session.getAttribute("name"));
        response.put("sessionAge", session.getAttribute("age"));

        return response;
    }

    @PostMapping("/create")
    public Map<String, String> cookieCreate(String name, String value, HttpServletResponse response) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        response.addCookie(cookie);

        Map<String, String> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "Cookie created: " + name);
        return result;
    }

    @PostMapping("/session/create")
    public Map<String, String> sessionCreate(String name, String value, HttpServletRequest request) {
        HttpSession session = request.getSession();
        session.setAttribute(name, value);

        Map<String, String> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "Session attribute set: " + name);
        return result;
    }
}