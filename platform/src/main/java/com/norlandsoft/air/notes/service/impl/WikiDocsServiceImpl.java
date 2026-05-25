/**
 * 文档服务实现
 *
 * @author ChaiMingXu
 * @since 2026/05/25
 */
package com.norlandsoft.air.notes.service.impl;

import com.norlandsoft.air.framework.sdk.util.IDGenerator;
import com.norlandsoft.air.framework.sdk.util.TemplateUtils;
import com.norlandsoft.air.framework.sdk.web.ActionResponse;
import com.norlandsoft.air.notes.mapper.WikiDocMapper;
import com.norlandsoft.air.notes.mapper.WikiMindMapper;
import com.norlandsoft.air.notes.model.dto.DocUpdateDTO;
import com.norlandsoft.air.notes.model.entity.WikiDocument;
import com.norlandsoft.air.notes.model.entity.WikiDocument.BreadCrumbItem;
import com.norlandsoft.air.notes.model.entity.WikiMindNode;
import com.norlandsoft.air.notes.model.vo.DocDetailVO;
import com.norlandsoft.air.notes.model.vo.DocMenuVO;
import com.norlandsoft.air.notes.model.vo.MindNodeVO;
import com.norlandsoft.air.notes.service.WikiDocsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WikiDocsServiceImpl implements WikiDocsService {

  private final WikiDocMapper docMapper;
  private final WikiMindMapper mindMapper;

  private static final String ROOT_ID = "000000";

  @Override
  public ActionResponse<List<DocMenuVO>> getDocumentMenu(String spaceId) {
    try {
      if (spaceId == null || spaceId.trim().isEmpty()) {
        return ActionResponse.success(Collections.emptyList());
      }

      List<WikiDocument> docs = docMapper.selectMenuItems(spaceId);
      List<DocMenuVO> tree = buildMenuTree(docs);
      return ActionResponse.success(tree);
    } catch (Exception e) {
      log.error("查询文档菜单失败", e);
      return ActionResponse.error("990510", "查询文档菜单失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<DocDetailVO> getDocumentInfo(String id) {
    try {
      WikiDocument doc = docMapper.selectById(id);
      if (doc == null) {
        return ActionResponse.error("990511", "文档不存在");
      }

      DocDetailVO vo = toDocDetailVO(doc);

      List<BreadCrumbItem> bcList = docMapper.selectBreadCrumb(id);
      if (bcList != null && !bcList.isEmpty()) {
        bcList.remove(bcList.size() - 1);
      }

      List<DocMenuVO> breadCrumb = new ArrayList<>();
      if (bcList != null) {
        for (BreadCrumbItem item : bcList) {
          DocMenuVO bcItem = new DocMenuVO();
          bcItem.setKey(item.getKey());
          bcItem.setLabel(item.getLabel());
          breadCrumb.add(bcItem);
        }
      }
      vo.setBreadCrumb(breadCrumb);

      return ActionResponse.success(vo);
    } catch (Exception e) {
      log.error("查询文档详情失败", e);
      return ActionResponse.error("990512", "查询文档详情失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<DocDetailVO> saveDocument(DocUpdateDTO dto, String userId) {
    try {
      String id = dto.getId();

      if (id == null || id.trim().isEmpty()) {
        return createDocument(dto, userId);
      } else {
        return updateDocument(dto);
      }
    } catch (Exception e) {
      log.error("保存文档失败", e);
      return ActionResponse.error("990513", "保存文档失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<Void> deleteDocument(String id) {
    try {
      WikiDocument doc = docMapper.selectById(id);
      if (doc == null) {
        return ActionResponse.error("990514", "文档不存在");
      }

      if ("mind".equalsIgnoreCase(doc.getFormat())) {
        mindMapper.deleteByDocumentId(id);
      }

      docMapper.deleteById(id);
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("删除文档失败", e);
      return ActionResponse.error("990515", "删除文档失败: " + e.getMessage());
    }
  }

  @Transactional(rollbackFor = Exception.class)
  @Override
  public ActionResponse<Void> updateMindMap(List<Map<String, Object>> items) {
    try {
      if (items == null || items.isEmpty()) {
        return ActionResponse.success();
      }

      String documentId = null;
      for (Map<String, Object> item : items) {
        String itemId = (String) item.get("id");
        if (itemId != null && itemId.startsWith("root-")) {
          documentId = (String) item.get("documentId");
          break;
        }
      }

      if (documentId == null || documentId.trim().isEmpty()) {
        return ActionResponse.error("990516", "思维导图根节点不存在，无法确定文档ID");
      }

      mindMapper.deleteByDocumentId(documentId);

      for (Map<String, Object> item : items) {
        WikiMindNode node = new WikiMindNode();
        node.setId((String) item.get("id"));
        node.setValue(item.get("value") != null ? item.get("value").toString() : null);
        node.setParentId((String) item.get("parentId"));
        node.setDocumentId((String) item.get("documentId"));
        node.setLevel(item.get("level") != null ? ((Number) item.get("level")).intValue() : 0);
        mindMapper.insertOrUpdate(node);
      }

      return ActionResponse.success();
    } catch (Exception e) {
      log.error("更新思维导图失败", e);
      return ActionResponse.error("990517", "更新思维导图失败: " + e.getMessage());
    }
  }

  @Override
  public ActionResponse<List<MindNodeVO>> getMindMapItems(String documentId) {
    try {
      if (documentId == null || documentId.trim().isEmpty()) {
        return ActionResponse.success();
      }

      List<WikiMindNode> nodes = mindMapper.selectByDocumentId(documentId);
      if (nodes != null && !nodes.isEmpty()) {
        List<MindNodeVO> result = new ArrayList<>();
        for (WikiMindNode node : nodes) {
          result.add(toMindNodeVO(node));
        }
        return ActionResponse.success(result);
      }
      return ActionResponse.success();
    } catch (Exception e) {
      log.error("查询思维导图失败", e);
      return ActionResponse.error("990518", "查询思维导图失败: " + e.getMessage());
    }
  }

  private ActionResponse<DocDetailVO> createDocument(DocUpdateDTO dto, String userId) {
    WikiDocument doc = new WikiDocument();
    doc.setId(IDGenerator.shortID());
    doc.setTitle(dto.getTitle());
    doc.setSpace(dto.getSpace());
    doc.setParentId(dto.getParentId());
    doc.setFormat(dto.getFormat());
    doc.setFileType(dto.getFileType());
    doc.setStatus("A");
    doc.setCreatorId(userId);
    doc.setSortOrder(0);
    doc.setCreateTime(LocalDateTime.now());
    doc.setUpdateTime(LocalDateTime.now());

    String format = doc.getFormat();

    if ("board".equals(format)) {
      doc.setIcon("sketch");
      String content = TemplateUtils.processTemplate("tpl/wiki/sketch.json",
          Map.of("NAME", doc.getTitle() != null ? doc.getTitle() : ""));
      doc.setContent(content);
    } else if ("mind".equals(format)) {
      doc.setIcon("mind_map");
      String content = TemplateUtils.readTemplate("tpl/wiki/mind_map.json");
      doc.setContent(content);
    } else {
      doc.setIcon("document");
      String content = TemplateUtils.readTemplate("tpl/wiki/document.json");
      doc.setContent(content);
    }

    docMapper.insert(doc);
    return ActionResponse.success(toDocDetailVO(doc));
  }

  private ActionResponse<DocDetailVO> updateDocument(DocUpdateDTO dto) {
    String id = dto.getId();
    WikiDocument existing = docMapper.selectById(id);
    if (existing == null) {
      return ActionResponse.error("990519", "文档不存在，无法更新");
    }

    WikiDocument doc = new WikiDocument();
    doc.setId(id);
    doc.setTitle(dto.getTitle());
    doc.setIcon(dto.getIcon());
    doc.setContent(dto.getContent());
    doc.setSortOrder(dto.getSortOrder());

    docMapper.update(doc);

    WikiDocument updated = docMapper.selectById(id);
    return ActionResponse.success(toDocDetailVO(updated));
  }

  private List<DocMenuVO> buildMenuTree(List<WikiDocument> docs) {
    if (docs == null || docs.isEmpty()) {
      return Collections.emptyList();
    }

    Map<String, List<WikiDocument>> childrenMap = new HashMap<>();
    for (WikiDocument doc : docs) {
      String parentId = doc.getParentId() != null ? doc.getParentId() : ROOT_ID;
      childrenMap.computeIfAbsent(parentId, k -> new ArrayList<>()).add(doc);
    }

    return buildChildren(childrenMap, ROOT_ID);
  }

  private List<DocMenuVO> buildChildren(Map<String, List<WikiDocument>> childrenMap, String parentId) {
    List<WikiDocument> children = childrenMap.get(parentId);
    if (children == null || children.isEmpty()) {
      return null;
    }

    List<DocMenuVO> result = new ArrayList<>();
    for (WikiDocument doc : children) {
      DocMenuVO node = new DocMenuVO();
      node.setKey(doc.getId());
      node.setLabel(doc.getTitle());
      node.setData(doc.getFormat());
      node.setImage(doc.getIcon());
      node.setParent(doc.getParentId());
      node.setType("group");

      List<DocMenuVO> subChildren = buildChildren(childrenMap, doc.getId());
      node.setChildren(subChildren);

      result.add(node);
    }
    return result;
  }

  private DocDetailVO toDocDetailVO(WikiDocument doc) {
    if (doc == null) {
      return null;
    }
    DocDetailVO vo = new DocDetailVO();
    vo.setId(doc.getId());
    vo.setTitle(doc.getTitle());
    vo.setIcon(doc.getIcon());
    vo.setSpace(doc.getSpace());
    vo.setParentId(doc.getParentId());
    vo.setFormat(doc.getFormat());
    vo.setContent(doc.getContent());
    vo.setCreatorId(doc.getCreatorId());
    vo.setCreatorName(doc.getCreatorName());
    vo.setCreateTime(doc.getCreateTime());
    vo.setUpdateTime(doc.getUpdateTime());
    return vo;
  }

  private MindNodeVO toMindNodeVO(WikiMindNode node) {
    if (node == null) {
      return null;
    }
    MindNodeVO vo = new MindNodeVO();
    vo.setId(node.getId());
    vo.setValue(node.getValue());
    vo.setParentId(node.getParentId());
    vo.setDocumentId(node.getDocumentId());
    vo.setLevel(node.getLevel());
    return vo;
  }
}
