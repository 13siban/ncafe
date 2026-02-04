
import java.sql.SQLException;

import java.util.Scanner;

import java.lang.reflect.Field;
import java.lang.reflect.Method;



public class App {
    public static void main(String[] args) throws ClassNotFoundException, SQLException {

        // Java Relection, RTTI

        Menu menu = new Menu();

        Class<?> clazz = menu.getClass();
        Class<?> clazz2 = Menu.class;  // RTTI  Runtime Type Information

        Field[] fields = clazz.getFields();
        for (Field field : fields) {
            System.out.println(field.getName());
        }

        Method[] methods = clazz.getMethods();
        for (Method method : methods) {
            System.out.println(method.getName());
        }

        // String sql = "select" ++ " from" "";












        // System.out.println("Hello World");

        // Scanner sc = new Scanner(System.in, "MS949");
        // System.out.print("검색할 메뉴명을 입력하세요: ");
        
        
        // // String korName = "아메리카노";
        
        // //사용자한테 입력받은 데이터
        // String korName = sc.nextLine();
        


        // MenuRepository menuRepository = new NewMenuRepository(null);
        // List<Menu> menus = menuRepository.findAllByName(korName);

        // System.out.println(menus);

        // Class.forName("org.postgresql.Driver");
        // Connection conn = DriverManager.getConnection(
        //         "jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
        //         "postgres.mfajsoljfhagiftaoufe", "duddlfncafe");

        // String sql = "SELECT * FROM menus";
        // Statement stmt = conn.createStatement();
        // ResultSet rs = stmt.executeQuery(sql);

        // while (rs.next()) {
        //     Menu menu = new Menu();
        //     menu.setId(rs.getLong("id"));
        //     menu.setKorName(rs.getString("kor_name"));
        //     menu.setEngName(rs.getString("eng_name"));
        //     menu.setPrice(rs.getInt("price"));
        //     menu.setCategoryId(rs.getInt("category_id"));
            
        //     menus.add(menu);
        // }
        // rs.close();
        // stmt.close();
        // conn.close();

        // System.out.println(menus);

        // String sql = "SELECT * FROM menus";

        // // API 에게 이거 sql 문장 실행해줘

        // // 0. 드라이버 로드
        // Class.forName("org.postgresql.Driver");

        // // 1. 인증
        // Connection conn = DriverManager.getConnection(
        // "jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres",
        // "postgres.mfajsoljfhagiftaoufe", "duddlfncafe");

        // // 2. 실행
        // Statement stmt = conn.createStatement();
        // ResultSet rs = stmt.executeQuery(sql);

        // // 3. 결과 받기
        // rs.next();
        // System.out.println(rs.getString("kor_name"));

    }
}
