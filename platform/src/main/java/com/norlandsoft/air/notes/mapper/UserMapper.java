package com.norlandsoft.air.notes.mapper;

import com.norlandsoft.air.notes.model.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

  int insert(User user);

  User selectById(@Param("id") String id);

  int updatePassword(@Param("id") String id, @Param("password") String password, @Param("salt") String salt);
}
