import { Connection, Submittable } from "pg";
import {
  ParameterDescriptionMessage,
  RowDescriptionMessage,
} from "pg-protocol/dist/messages";

interface DescriberData {
  parameterOids: ParameterDescriptionMessage["dataTypeIDs"];
  fields: RowDescriptionMessage["fields"];
}

// Note: a submittable needs to end with the backend sending a ReadyForQuery so the connection can continue to be used.
// This can be achieved by sending a sync message
export class Describer implements Submittable {
  promise;
  resolve?: (value: DescriberData | PromiseLike<DescriberData> | null) => void;
  reject?: (reason?: any) => void;
  data: Partial<DescriberData>;
  query;

  constructor(query: string) {
    this.data = {};
    this.query = query;
    this.promise = new Promise<DescriberData | null>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  submit(conn: Connection) {
    conn.parse({ name: "", types: [], text: this.query }, false);
    conn.describe({ name: "", type: "S" }, false);
    conn.flush();

    const cleanup = () => {
      conn.removeListener("message", listener);
      conn.sync();
    };

    const listener = (msg: any) => {
      switch (msg.name) {
        case "parseComplete":
          break;
        case "parameterDescription":
          this.data.parameterOids = msg.dataTypeIDs;
          break;
        case "rowDescription":
          this.data.fields = msg.fields;
          break;
        case "noData":
          cleanup();
          this.resolve?.(null);
          return;
        case "error":
          cleanup();
          this.reject?.(msg);
          return;
        default:
          cleanup();
          this.reject?.(new Error(`Unexpected message ${msg.name}`));
          return;
      }

      const fields = this.data.fields;
      const parameterOids = this.data.parameterOids;
      if (fields && parameterOids) {
        cleanup();
        this.resolve?.({ fields, parameterOids });
      }
    };
    conn.addListener("message", listener);
  }

  handleRowDescription() {}
  handleError() {}
  handleReadyForQuery() {}
}
