import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
public class EchoClient {
    public static void main(String[] args) throws Exception {
        String hostName = "115.95.149.11";
        int portNumber = 18888;
        Socket dataSocket = new Socket(hostName, portNumber);

    }
}