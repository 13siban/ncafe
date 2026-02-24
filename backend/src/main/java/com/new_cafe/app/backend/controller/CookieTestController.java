
package com.new_cafe.app.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.web.bind.annotation.CookieValue;

@Controller
@RequestMapping("/cookie")
public class CookieTestController {

    @GetMapping("/test")
    public String cookieTest(
        @CookieValue(name = "name", required = false) String name,
        @CookieValue(name = "age", required = false) String age,
        Model model
    ) {

        model.addAttribute("name", name);
        model.addAttribute("age", age);
        return "test";
    }

    @GetMapping("/create")
    public String createCookie(Model model) {
        return "create";
    }

    @PostMapping("/create")
    public String createCookie(String name, String value, HttpServletResponse response) {
        System.out.println("쿠키 생성 요청: " + name + " = " + value);

        Cookie cookie = new Cookie(name, value);
        // cookie.setMaxAge(60 * 60 * 24 * 7);
        cookie.setPath("/cookie");
        // response.addCookie(cookie);
        response.addCookie(cookie);

        return "redirect:/cookie/test";
    }

}