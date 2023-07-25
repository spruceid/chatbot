import { Client, Types, defaultClientConfig } from "@spruceid/rebase-client";
import { WasmClient } from "@spruceid/rebase-client/wasm";
import { Content } from "@/types/rebase";

const client = new Client(new WasmClient(JSON.stringify(defaultClientConfig())));

const subjectFromAddress = (address: string) => {
    return {
        pkh: {
            eip155: {
                address,
                chain_id: "1"
            }
        }
    }
}

const statementFromContentAndAddress = (content: Content, address: string): Types.BasicPostAttestationStatement => {
    return {
        subject: subjectFromAddress(address), 
        body: content.body,
        title: content.title,
        reply_to: null,
    };
};

export const statement = async (content: Content, address: string): Promise<string> => {
    let req: Types.Statements = {
        Attestation: {
            BasicPostAttestation: statementFromContentAndAddress(content, address)
        }
    };

    let resp = await client.statement(req);
    if (!resp.statement) {
        throw new Error("No statement found in witness response");
    }

    return resp.statement;
}

export const witness = async (content: Content, address: string, signature: string): Promise<string> => {
    let req: Types.Proofs = {
            Attestation: {
                BasicPostAttestation: {
                    signature,
                    statement: statementFromContentAndAddress(content, address)
                }
            }
    };

    let resp = await client.witness_jwt(req);
    if (!resp.jwt) {
        // NOTE: if all is working correctly, there may be a useful message at
        // respBody.error.
        throw new Error("No jwt found in witness response");
    }

    return resp.jwt;
}

const encode = (c: any): string => {
    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
};

export const parseJWT = (jwt_str: string): any => {
    const v = jwt_str.split(".");

    if (v.length !== 3) {
        throw new Error("Invalid JWT format");
    }

    const u = v[1];
    const b64 = u.replace(/-/g, "+").replace(/_/g, "/");
    const encoded = atob(b64).split("").map(encode).join("");
    const json_str = decodeURIComponent(encoded);

    return JSON.parse(json_str);
};

// issue takes a content object, a full-and-prefixed-with-0x ethereum address, 
// and a function that signs a plain text statement and returns the signature
// then returns the un-parsed jwt string. Throws if anything goes wrong.
export const issue = async (content: Content, address: string, sign: (statement: string) => Promise<string>): Promise<string> => {
    let st = await statement(content, address);
    let sig = await sign(st);
    return await witness(content, address, sig);
}