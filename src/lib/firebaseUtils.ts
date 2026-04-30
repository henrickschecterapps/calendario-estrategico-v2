import { 
  QueryDocumentSnapshot, 
  SnapshotOptions, 
  DocumentData, 
  FirestoreDataConverter,
  WithFieldValue
} from "firebase/firestore";

/**
 * Cria um conversor genérico para o Firestore que injeta o ID do documento
 * e garante a tipagem forte para as coleções.
 */
export const genericConverter = <T extends { id: string }>(): FirestoreDataConverter<T> => ({
  toFirestore(data: WithFieldValue<T>): DocumentData {
    // Removemos o ID antes de salvar, pois ele já é a chave do documento
    const { id, ...rest } = data as any;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): T {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      ...data
    } as T;
  }
});
