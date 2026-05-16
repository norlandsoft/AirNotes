package com.norlandsoft.air.notes;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.norlandsoft.air.notes.mapper")
public class AirNotes {

    public static void main(String[] args) {
        SpringApplication.run(AirNotes.class, args);
    }
}
