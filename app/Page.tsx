'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card';
import {AnalyzeImageIdentifyIngredientsOutput, analyzeImageIdentifyIngredients} from '@/ai/flows/analyze-image-identify-ingredients';
import {GenerateRecipeFromImageAnalysisOutput, generateRecipeFromImageAnalysis} from '@/ai/flows/generate-recipe-from-image-analysis';
import {toast} from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Edit, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [recipe, setRecipe] = useState<GenerateRecipeFromImageAnalysisOutput | null>(null);
  const [ingredients, setIngredients] = useState<AnalyzeImageIdentifyIngredientsOutput | null>(null);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>('');

  const handleImageAnalysis = async () => {
    if (!photo && !imageUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload an image or enter an image URL.',
      });
      return;
    }

    setLoading(true);
    try {
      const imageUrlToUse = photoUrl || imageUrl;

      if (!imageUrlToUse) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please provide a valid image source.',
        });
        return;
      }

      const imageAnalysis = await analyzeImageIdentifyIngredients({photoUrl: imageUrlToUse});
      setIngredients(imageAnalysis);

      const recipeDraft = await generateRecipeFromImageAnalysis({
        dishType: imageAnalysis.dishType,
        ingredients: imageAnalysis.ingredients,
        photoUrl: imageUrlToUse,
      });

      setRecipe(recipeDraft);
      setDescription(recipeDraft.recipeDraft.description);
      setInstructions(recipeDraft.recipeDraft.instructions);
      toast({
        title: "Recipe Generated!",
        description: "Check out your new recipe!",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message,
      })
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoUrl(URL.createObjectURL(file));
       setImageUrl('');
    }
  };

  const handleIngredientChange = (index: number, value: string) => {
    setIngredients((prevIngredients) => {
      if (!prevIngredients) {
        return prevIngredients;
      }

      const updatedIngredients = {...prevIngredients};
      updatedIngredients.ingredients = [...prevIngredients.ingredients]; // Clone the ingredients array
      updatedIngredients.ingredients[index] = value; // Update the ingredient at the given index
      return updatedIngredients;
    });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const deleteInstruction = (index: number) => {
    const newInstructions = [...instructions];
    newInstructions.splice(index, 1);
    setInstructions(newInstructions);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10 bg-background">
      <Toaster />
      <h1 className="text-4xl font-bold mb-4">SnapRecipe</h1>
      <p className="text-muted-foreground mb-6">Turn your food photos into delicious recipes!</p>
      <div className="flex flex-col items-center mb-8">
        <Input
          type="file"
          accept="image/*"
          className="w-full max-w-md mb-4 rounded-md shadow-sm"
          onChange={handlePhotoChange}
        />
        <Input
          type="url"
          placeholder="Enter image URL"
          className="w-full max-w-md mb-4 rounded-md shadow-sm"
          value={imageUrl}
          onChange={(e) => {
               setImageUrl(e.target.value)
               setPhoto(null)
               setPhotoUrl('')
              }
            }
        />
        <Button onClick={handleImageAnalysis} disabled={loading || (!photo && !imageUrl)} className="rounded-md shadow-md">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Recipe'
          )}
        </Button>
      </div>

      {recipe && ingredients ? (
        <Card className="w-full max-w-2xl rounded-lg shadow-md">
          <CardHeader>
            <CardTitle>{ingredients?.dishType}</CardTitle>
            <CardDescription>Here is your AI-generated recipe. Feel free to edit!</CardDescription>
          </CardHeader>
          <CardContent>
            {photoUrl && (
              <img src={photoUrl} alt="Food" className="w-full rounded-md mb-4" />
            )}
            {imageUrl && !photoUrl && (
              <img src={imageUrl} alt="Food" className="w-full rounded-md mb-4" />
            )}
            <h3 className="text-2xl font-semibold mb-2">Description</h3>
            {editing ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mb-4 rounded-md shadow-sm"
              />
            ) : (
              <p className="mb-4">{description}</p>
            )}

            <h3 className="text-2xl font-semibold mt-4 mb-2">Ingredients</h3>
            {ingredients?.ingredients.map((ingredient, index) => (
              <div key={index} className="mb-2">
                {editing ? (
                  <Input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="w-full rounded-md shadow-sm"
                  />
                ) : (
                  <p>- {ingredient}</p>
                )}
              </div>
            ))}

            <h3 className="text-2xl font-semibold mt-4 mb-2">Instructions</h3>
            {instructions.map((instruction, index) => (
              <div key={index} className="mb-2 flex items-start">
                {editing ? (
                  <div className="flex w-full">
                    <Textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      className="w-full mr-2 rounded-md shadow-sm"
                    />
                    <Button variant="outline" size="icon" onClick={() => deleteInstruction(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="ml-4">{index + 1}. {instruction}</p>
                )}
              </div>
            ))}
            {editing && (
              <Button variant="secondary" onClick={addInstruction} className="rounded-md shadow-sm">
                Add Instruction
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => setEditing(!editing)} className="rounded-md shadow-sm">{editing ? 'Save' :  <> <Edit className="mr-2 h-4 w-4"/> Edit </>}</Button>
          </CardFooter>
        </Card>
      ) : (
        <p className="text-muted-foreground">Upload a photo or enter an image URL to generate a recipe.</p>
      )}
    </div>
  );
}

import { Trash } from 'lucide-react';
