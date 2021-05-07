import React, { useCallback, useContext, useEffect, useState } from "react";
import { ContentTable, ContentTableColumn, ContentTableRow, ContentType, VirtualizedContentTable } from "./table";
import LogCurveInfo from "../../models/logCurveInfo";
import LogObjectService from "../../services/logObjectService";
import { truncateAbortHandler } from "../../services/apiClient";
import LogCurveInfoContextMenu, { LogCurveInfoContextMenuProps } from "../ContextMenus/LogCurveInfoContextMenu";
import NavigationContext from "../../contexts/navigationContext";
import OperationContext from "../../contexts/operationContext";
import OperationType from "../../contexts/operationType";
import { getContextMenuPosition } from "../ContextMenus/ContextMenu";

export interface LogCurveInfoRow extends ContentTableRow {
  uid: string;
  mnemonic: string;
  minIndex: number | Date;
  maxIndex: number | Date;
  classWitsml: string;
  unit: string;
  mnemAlias: string;
  logUid: string;
  wellUid: string;
  wellboreUid: string;
  wellName: string;
  wellboreName: string;
}

export const LogCurveInfoListView = (): React.ReactElement => {
  const { navigationState, dispatchNavigation } = useContext(NavigationContext);
  const { selectedServer, selectedWell, selectedWellbore, selectedLog } = navigationState;
  const { dispatchOperation } = useContext(OperationContext);
  const [logCurveInfoList, setLogCurveInfoList] = useState<LogCurveInfo[]>([]);
  const isDepthIndex = !!logCurveInfoList?.[0]?.maxDepthIndex;
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);

  useEffect(() => {
    setIsFetchingData(true);
    if (selectedLog) {
      const controller = new AbortController();

      const getLogCurveInfo = async () => {
        const logCurveInfo = await LogObjectService.getLogCurveInfo(selectedWell.uid, selectedWellbore.uid, selectedLog.uid, controller.signal);
        setLogCurveInfoList(logCurveInfo);
        setIsFetchingData(false);
      };

      getLogCurveInfo().catch(truncateAbortHandler);

      return () => {
        controller.abort();
      };
    }
  }, [selectedLog]);

  const onContextMenu = useCallback((event: React.MouseEvent<HTMLLIElement>, {}, checkedLogCurveInfoRows: LogCurveInfoRow[]) => {
    const contextMenuProps: LogCurveInfoContextMenuProps = { checkedLogCurveInfoRows, dispatchOperation, dispatchNavigation, selectedLog, selectedServer };
    const position = getContextMenuPosition(event);
    dispatchOperation({ type: OperationType.DisplayContextMenu, payload: { component: <LogCurveInfoContextMenu {...contextMenuProps} />, position } });
  }, []);

  const getTableData = useCallback(() => {
    return logCurveInfoList.map((logCurveInfo) => {
      return {
        id: `${selectedLog.uid}-${logCurveInfo.mnemonic}`,
        uid: logCurveInfo.uid,
        mnemonic: logCurveInfo.mnemonic,
        minIndex: isDepthIndex ? logCurveInfo.minDepthIndex : logCurveInfo.minDateTimeIndex,
        maxIndex: isDepthIndex ? logCurveInfo.maxDepthIndex : logCurveInfo.maxDateTimeIndex,
        classWitsml: logCurveInfo.classWitsml,
        unit: logCurveInfo.unit,
        mnemAlias: logCurveInfo.mnemAlias,
        logUid: selectedLog.uid,
        wellUid: selectedWell.uid,
        wellboreUid: selectedWellbore.uid,
        wellName: selectedWell.name,
        wellboreName: selectedWellbore.name
      };
    });
  }, [logCurveInfoList]);

  const columns: ContentTableColumn[] = [
    { property: "mnemonic", label: "Mnemonic", type: ContentType.String },
    { property: "minIndex", label: "MinIndex", type: isDepthIndex ? ContentType.Number : ContentType.DateTime },
    { property: "maxIndex", label: "MaxIndex", type: isDepthIndex ? ContentType.Number : ContentType.DateTime },
    { property: "classWitsml", label: "ClassWitsml", type: ContentType.String },
    { property: "unit", label: "Unit", type: ContentType.String },
    { property: "mnemAlias", label: "MnemAlias", type: ContentType.String },
    { property: "uid", label: "uid", type: ContentType.String }
  ];

  return selectedLog && !isFetchingData ? (
    logCurveInfoList.length < 100 ? (
      <ContentTable columns={columns} data={getTableData()} onContextMenu={onContextMenu} checkableRows />
    ) : (
      <VirtualizedContentTable columns={columns} data={getTableData()} onContextMenu={onContextMenu} checkableRows />
    )
  ) : (
    <></>
  );
};

export default LogCurveInfoListView;
